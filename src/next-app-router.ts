import chalk from 'chalk'
import { existsSync } from 'fs'
import { mkdir, readFile, rm, writeFile } from 'fs/promises'
import { dirname, join, resolve } from 'path'
import { createElement, Fragment } from 'react'
import ReactHelmet from 'react-helmet-async'
import type { StaticHandlerContext } from 'react-router-dom/server'
import {
  createStaticRouter,
  StaticRouterProvider,
  // @ts-ignore
} from 'react-router-dom/server.mjs'
import { fileURLToPath } from 'url'
import {
  createServer,
  loadConfigFromFile,
  normalizePath,
  type Plugin,
  type ViteDevServer,
} from 'vite'

import { compile } from './compiler'
import { RouterManager } from './entities/RouterManager'
import { renderHtml } from './renderer/render-html'
import { addMiddleware } from './utils/add-middleware'
import { resolveManifest } from './utils/resolve-manifest'
import { toRouterPath } from './utils/to-router-path'

export function nextAppRouter(): Plugin {
  let viteServer: null | ViteDevServer = null
  let isBuild = false
  return {
    name: 'next-app-router',
    enforce: 'pre',
    apply: (config, env) => {
      isBuild = env.command === 'build'
      return (
        !('configFile' in config) ||
        ('configFile' in config && config.configFile !== false)
      )
    },
    configResolved: async function (config) {
      if (isBuild) {
        const fileConfig = (await loadConfigFromFile(
          {
            command: 'build',
            mode: 'production',
          },
          config.configFile,
        ))!.config
        viteServer = await createServer({
          ...fileConfig,
          mode: 'production',
          configFile: false,
          plugins: [
            ...fileConfig.plugins!.flat().filter((el) => el && 'name' in el),
            {
              name: 'prod jsx',
              config() {
                return {
                  esbuild: {
                    jsxDev: false,
                  },
                }
              },
            },
          ],
        })
      }
    },
    transform: async function (code, id, options) {
      if (options?.ssr) return
      if (!id.includes('/src/app')) return
      if (!/(page|layout)\.[jt]sx?$/.test(id)) return
      if (/^["']use client["']|\n["']use client["']/.test(code)) return
      if (!viteServer) return

      // client 일 때 서버 컴포넌트 (페이지)
      return compile(viteServer, id, code, isBuild ? 'build' : 'serve')
    },
    configureServer: async (server) => {
      // 빌드가 아닐 경우 재활용 합니다.
      if (!isBuild) {
        viteServer = server
      }
      return () => addMiddleware(server)
    },
    closeBundle: async function () {
      if (!viteServer) return
      const manager = RouterManager.create(viteServer, 'build')
      const handler = await manager.getStaticHandler()
      const output = viteServer.config.build.outDir ?? 'dist'
      const meta = resolve(output, '.vite', 'manifest.json')
      if (!existsSync(meta)) return
      let ssgError = false
      const manifest = JSON.parse(await readFile(meta, 'utf-8'))

      const pages = Object.values<{
        file: string
        src: string
        css: string[]
      }>(manifest).filter(({ src }) => {
        return /\/page\.[tj]sx?$/.test(src)
      })
      console.info(chalk.cyan(`create static pages (total :${pages.length})`))
      let cnt = 0
      await Promise.all(
        pages.map(async ({ src }) => {
          const url = toRouterPath(src)
          const basePageFile = normalizePath(join(output, url, 'index.html'))
          try {
            // real file path
            const targetPaths = await manager.loadPage(url)
            const { js, css } = resolveManifest(manifest, src)
            const buildRes = await Promise.all(
              targetPaths.map<Promise<[string, number]>>(async (el) => {
                const pageFile = normalizePath(join(output, el, 'index.html'))
                await mkdir(dirname(pageFile), {
                  recursive: true,
                })
                // url has a leading slash, so remove it for the file system
                const context = (await handler.query(
                  new Request(`http://localhost${el}`),
                )) as StaticHandlerContext

                const router = createStaticRouter(handler.dataRoutes, context)

                const html = renderHtml(
                  createElement(
                    Fragment,
                    null,
                    createElement(StaticRouterProvider, {
                      router,
                      context,
                    }),
                    createElement(
                      ReactHelmet.Helmet,
                      null,
                      ...css.map((el) =>
                        createElement('link', {
                          rel: 'stylesheet',
                          href: `/${el}`,
                          ['data-nar']: 'static',
                        }),
                      ),
                      ...js.map((file) =>
                        createElement('script', {
                          type: 'module',
                          src: `/${file}`,
                          ['data-nar']: 'static',
                        }),
                      ),
                    ),
                  ),
                  'production',
                )
                const blob = new Blob([html], { type: 'text/html' })
                await writeFile(pageFile, html)
                return [pageFile, blob.size]
              }),
            )

            console.info(
              chalk.yellowBright(
                `${buildRes.length === 1 ? buildRes[0][0] : `${basePageFile}(MultiParams)`} (${++cnt}/${pages.length}) ${buildRes.length === 1 ? (buildRes[0][1] / 1024).toLocaleString() + ' kB' : ''}`,
              ),
            )
            if (buildRes.length > 1)
              for (const [pageFile, size] of buildRes) {
                console.info(
                  chalk.yellow(
                    `- ${basePageFile} -> ${pageFile} (${(size / 1024).toLocaleString()} kB)`,
                  ),
                )
              }
          } catch (e) {
            ssgError = true
            console.error(e)
            console.error(
              chalk.red(
                `create ${basePageFile} (${++cnt}/${pages.length}) fail`,
              ),
            )
          }
        }),
      )
      await rm(resolve(output, '.vite'), {
        force: true,
        recursive: true,
      })

      await viteServer.close()
      if (ssgError) {
        console.error(chalk.red('✗ Fail Nar Page Build'))
        return
      }
      console.info(chalk.green('✓️ Success Nar Page Build'))
    },
    config: (_, env) => {
      const main = resolve(
        fileURLToPath(import.meta.resolve('vite-plugin-next-app-router')),
        '..',
        '..',
        'main.tsx',
      )
      const entryPluginClient = resolve(
        fileURLToPath(import.meta.resolve('vite-plugin-next-app-router')),
        '..',
        'client',
      )
      return {
        appType: 'custom',
        build: {
          manifest: true,
          rollupOptions: {
            input: main,
            output: {
              sourcemap: false,
            },
            onLog(level, log, handler) {
              if (
                log.cause &&
                (
                  log.cause as {
                    message: string
                  }
                ).message === `Can't resolve original location of error.`
              ) {
                return
              }
              handler(level, log)
            },
          },
          sourcemap: false,
        },
        esbuild: {
          jsxDev: env.mode !== 'production',
        },
        resolve: {
          alias: {
            '/_nar_entry': main,
            'vite-plugin-next-app-router/client': entryPluginClient,
            'react-router-dom': fileURLToPath(
              import.meta.resolve('react-router-dom'),
            ),
          },
        },
      }
    },
  }
}

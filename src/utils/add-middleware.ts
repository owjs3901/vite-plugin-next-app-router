import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { createElement } from 'react'
import {
  createStaticRouter,
  StaticHandlerContext,
  StaticRouterProvider,
  // @ts-ignore
} from 'react-router-dom/server.mjs'
import { type ViteDevServer } from 'vite'

import { RouterManager } from '../entities/RouterManager'
import { renderHtml } from '../renderer/render-html'

export function addMiddleware(server: ViteDevServer): void {
  const routerManager = RouterManager.create(server, 'serve')

  server.middlewares.use(async (req, res) => {
    try {
      if (
        !req.headers.accept?.startsWith('text/html') &&
        !req.url?.endsWith('/')
      ) {
        const root = server.config.root
        const staticFile = resolve(root, 'public', req.url!.substring(1))
        if (existsSync(staticFile)) res.end(await readFile(staticFile))
        else {
          res.statusCode = 404
          res.end('404')
        }
        return
      }
      const handler = await routerManager.getStaticHandler()
      // serve 일 경우 오직 1개의 라우터만 존재해야 합니다.
      await routerManager.loadPage(req.url!)
      const context = (await handler.query(
        new Request(`http://${req.headers.host}${req.url}`),
      )) as StaticHandlerContext

      const router = createStaticRouter(handler.dataRoutes, context)

      res.end(
        renderHtml(
          createElement(StaticRouterProvider, {
            router,
            context,
          }),
          'development',
          `<head data-nar='dev'>${await server.transformIndexHtml(req.url!, '')}</head>`,
        ),
      )
    } catch (e) {
      console.error(e)
      res.statusCode = 500
      res.end('500')
    }
  })
}

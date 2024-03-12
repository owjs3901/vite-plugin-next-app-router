import { globby } from 'globby'
import { ComponentType } from 'react'
import { generatePath, matchRoutes, useParams } from 'react-router-dom'
// @ts-ignore
import { createStaticHandler } from 'react-router-dom/server.mjs'
import { ViteDevServer } from 'vite'

import { runServerNode } from '../renderer/render-server-node'
import { createRoutes } from '../router/create-routes'

const cache = new Map<ViteDevServer, RouterManager>()

export class RouterManager {
  private server: ViteDevServer
  private readonly handler: Promise<ReturnType<typeof createStaticHandler>>
  private readonly command: 'build' | 'serve'
  private routeCache = new Map<string, any>()
  constructor(server: ViteDevServer, command: 'build' | 'serve') {
    this.server = server
    this.handler = this.loadRoutes()
    this.command = command
  }

  static create(
    server: ViteDevServer,
    command: 'build' | 'serve',
  ): RouterManager {
    if (cache.has(server)) return cache.get(server)!
    const manager = new RouterManager(server, command)
    cache.set(server, manager)
    return manager
  }

  /**
   * 라우터가 추가되거나 제거될 경우 호출합니다.
   */
  loadRoutes(): Promise<ReturnType<typeof createStaticHandler>> {
    return globby('src/app/**/{page,layout}.{js,jsx,ts,tsx}')
      .then((m) =>
        m.reduce<Record<string, () => Promise<{ default: ComponentType }>>>(
          (acc, m) => {
            acc[m] = () => this.server.ssrLoadModule(m) as any
            return acc
          },
          {},
        ),
      )
      .then(createRoutes)
      .then(createStaticHandler)
  }

  getStaticHandler(): Promise<ReturnType<typeof createStaticHandler>> {
    return this.handler
  }
  async loadPage(url: string): Promise<string[]> {
    const routes = matchRoutes(
      await this.getStaticHandler().then((handle) => handle.dataRoutes),
      url,
    )
    if (!routes) throw new Error(`not found ${url}`)
    const sortedRoutes = routes.sort(
      (a, b) =>
        (b.route.children?.length ?? 0) - (a.route.children?.length ?? 0),
    )
    const page = sortedRoutes.pop()
    if (!page) throw new Error(`not found page ${url}`)
    // build 에서는 page 는 반드시 1번만 로딩될 수 밖에 없습니다.
    // 만약 서버 상태에서 로딩이 이미 되었다면 Component 가 존재하므로 도달할 수 없습니다.
    if (this.command === 'build' && !page.route.lazy)
      throw new Error(`duplicate page url ${url}`)

    // lazy 를 다시 사용해야 하지만 존재한다면 Component 가 무시하기 때문에 옮깁니다.
    if (page.route.lazy) {
      ;(page.route as any).__DF_LAZY = page.route.lazy
      page.route.lazy = undefined
    }
    const { Component, generateStaticParams }: any = await (
      page.route as any
    ).__DF_LAZY()
    if (
      this.command === 'build' &&
      Object.keys(page.params).length &&
      !generateStaticParams
    )
      throw new Error(`generateStaticParams not found ${url}`)

    const paramsList: Record<string, unknown>[] =
      this.command === 'build' && generateStaticParams
        ? await generateStaticParams()
        : [page.params]

    const ret = paramsList.map((params) =>
      generatePath(page.pathnameBase, params),
    )

    if (!(page.route as any).Component)
      (page.route as any).Component = () => {
        // 실시간 params 를 가져와야 합니다.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const params = useParams()
        return this.routeCache.get(
          page.route.id + 'DF_ROUTER_SEP' + JSON.stringify(params),
        )
      }
    await Promise.all([
      Promise.all(
        // layout loop
        sortedRoutes.map(async (m) => {
          if (m.route.lazy) {
            ;(m.route as any).__DF_LAZY = m.route.lazy
            m.route.lazy = undefined
          }
          const lazyFunc = (m.route as any).__DF_LAZY

          const component: any = await lazyFunc()
          // params 에 따른 캐시 저장
          if (!(m.route as any).Component)
            (m.route as any).Component = () => {
              const cacheKey =
                // eslint-disable-next-line react-hooks/rules-of-hooks
                m.route.id + 'DF_ROUTER_SEP' + JSON.stringify(useParams())
              return this.routeCache.get(cacheKey)
            }
          return await Promise.all(
            paramsList.map(async (params: unknown) => {
              const cacheKey =
                m.route.id + 'DF_ROUTER_SEP' + JSON.stringify(params)
              if (this.command === 'build' && this.routeCache.has(cacheKey))
                return
              this.routeCache.set(
                cacheKey,
                await runServerNode(
                  // eslint-disable-next-line new-cap
                  await component.Component({ params }),
                ),
              )
              return component.metadata
            }),
          )
        }),
      ),
      Promise.all(
        paramsList.map(async (params: unknown) => {
          const cacheKey =
            page.route.id + 'DF_ROUTER_SEP' + JSON.stringify(params)
          if (this.command === 'build' && this.routeCache.has(cacheKey)) return

          this.routeCache.set(
            cacheKey,
            await runServerNode(
              // eslint-disable-next-line new-cap
              await Component({ params }),
            ),
          )
          return []
        }),
      ),
    ])
    return ret
  }
}

import { ComponentType, createElement } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import {
  createBrowserRouter,
  matchRoutes,
  RouterProvider,
} from 'react-router-dom'

// @ts-ignore
import { createRoutes } from './dist/client'

const dataObject = import.meta.glob(
  '/src/app/**/{layout,page}.{jsx,tsx,ts,js}',
) as Record<string, () => Promise<{ default: ComponentType }>>
const routes = createRoutes(dataObject)
const lazyMatches = matchRoutes(routes, window.location)?.filter(
  (m) => m.route.lazy,
)

if (lazyMatches?.length) {
  Promise.all(
    lazyMatches?.map(async (m) => {
      const routeModule = await m.route.lazy?.()
      Object.assign(m.route, {
        ...routeModule,
        lazy: undefined,
      })
    }) ?? [],
  ).then(() => {
    const devupHeadNode = document.querySelectorAll('[data-devup="static"]')
    hydrateRoot(
      document,
      <HelmetProvider>
        <Helmet>
          {[...devupHeadNode].map((el) => {
            return createElement(
              el.tagName.toLowerCase(),
              Object.values(el.attributes).reduce(
                (acc: Record<string, unknown>, { name, value }) => {
                  acc[name] = value
                  return acc
                },
                {},
              ),
            )
          })}
        </Helmet>
        <RouterProvider
          fallbackElement={null}
          router={createBrowserRouter(routes)}
        />
      </HelmetProvider>,
    )
  })
}

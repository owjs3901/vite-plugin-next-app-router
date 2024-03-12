import { ComponentType, createElement, Fragment } from 'react'
import { isElement } from 'react-is'
import { Outlet, RouteObject, useParams } from 'react-router-dom'

import { findNthIndex } from '../utils/find-nth-index'
import { pageLayoutCompare } from '../utils/page-layout-compare'
import { toRouterPath } from '../utils/to-router-path'
import { createMetadataElement } from './create-metadata-element'

export function createRoutes(
  dataObject: Record<
    string,
    () => Promise<{
      default: ComponentType
    }>
  >,
): RouteObject[] {
  // layout 이 먼저오게 하여 base router 가 먼저 렌더링 되도록 합니다.
  const routes: RouteObject[] = []
  let currentObj: RouteObject | null = null
  let prevLevel = 0
  for (const p of Object.keys(dataObject).sort(pageLayoutCompare)) {
    const isLayout = /layout\.[jt]sx?$/.test(p)
    const page = toRouterPath(p)
    const pageLevel = page.split('/').length

    if (isLayout) {
      const nextObj = {
        path:
          pageLevel === prevLevel
            ? page.substring(1)
            : page.substring(findNthIndex(page, '/', prevLevel) + 1),
        lazy: async () => {
          const {
            default: res,
            metadata,
            ...rest
          } = await dataObject[p]().then(
            (m) => m as { default: React.ComponentType; metadata?: any },
          )
          return {
            ...rest,
            Component: (props: any) => {
              const params =
                // eslint-disable-next-line react-hooks/rules-of-hooks
                typeof window !== 'undefined' ? useParams() : props.params

              return createElement(
                res,
                {
                  params,
                } as any,
                metadata &&
                  (isElement(metadata)
                    ? metadata
                    : createMetadataElement(metadata)),
                createElement(Outlet),
              )
            },
          }
        },
        children: [],
      }
      if (currentObj === null) {
        routes.push(nextObj)
      } else {
        currentObj.children?.push(nextObj)
      }
      currentObj = nextObj
      prevLevel = pageLevel
    } else {
      const nextObj = {
        path:
          pageLevel === prevLevel
            ? ''
            : page.substring(findNthIndex(page, '/', prevLevel) + 1),
        lazy: async () => {
          const {
            default: res,
            metadata,
            ...rest
          } = await dataObject[p]().then((m) => {
            return m as {
              default: React.ComponentType
              generateStaticParams?: () => Promise<Record<string, unknown>[]>
              metadata?: Record<string, unknown>
            }
          })
          return {
            ...rest,
            // page 는 children 이 없습니다.
            Component: (props: any) => {
              const params =
                // eslint-disable-next-line react-hooks/rules-of-hooks
                typeof window !== 'undefined' ? useParams() : props.params
              return createElement(
                Fragment,
                undefined,
                createElement(res, {
                  params,
                } as any),
                metadata &&
                  (isElement(metadata)
                    ? metadata
                    : createMetadataElement(metadata)),
              )
            },
          }
        },
      }
      if (currentObj === null) {
        routes.push(nextObj)
      } else {
        currentObj.children?.push(nextObj)
      }
    }
  }
  return routes
}

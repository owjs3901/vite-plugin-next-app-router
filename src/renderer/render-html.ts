import { createElement, ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import ReactHelmet from 'react-helmet-async'

export function renderHtml(
  element: ReactElement,
  mode: 'development' | 'production',
  tail = '',
): string {
  const context: any = {}
  let ret =
    '<!DOCTYPE html>' +
    renderToString(
      createElement(
        ReactHelmet.HelmetProvider,
        {
          context,
        },
        element,
      ),
    )

  if (mode === 'development')
    ret += `<script type='module' data-nar="entry" src='/_nar_entry'></script>`

  if (tail) ret += tail
  const headCode = Object.values<{
    toString(): string
    toComponent(): string
  }>((context as any).helmet)
    .map((el) => {
      return el.toString()
    })
    .join('')

  if (!ret.includes('<head')) throw new Error('head 태그가 없습니다.')
  return ret.replace(/<\/head[^>]*>/, (match) => headCode + match)
}

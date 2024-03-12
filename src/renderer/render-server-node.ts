import { Children, ReactElement, ReactNode } from 'react'
import { isElement, isForwardRef } from 'react-is'

/**
 * @param element
 */
export async function runServerNode(element: ReactElement): Promise<ReactNode> {
  if (element === undefined || element === null) return null
  if (
    typeof element.type === 'function' &&
    element.type.constructor.name === 'AsyncFunction'
  ) {
    // async 일 경우 반드시 server component 이므로 바로 호출하여 결과를 반환합니다.
    const ret = await (element.type as any)(element.props)
    if (isElement(ret)) return await runServerNode(ret)
    return ret
  }
  return {
    ...element,
    _store: undefined,
    key: element.key ?? null,
    props: {
      ...element.props,
      children:
        element.props.children &&
        (await Promise.all(
          Children.map(element.props.children, async (child) => {
            return isElement(child) ? await runServerNode(child) : child
          }),
        )),
    },
  } as any
}

function renderUnknownNode(node: any): string {
  if (typeof node === 'string' && node.startsWith('__DF_VAR.')) {
    return '{' + node.substring(9) + '}'
  }
  return '{' + JSON.stringify(node) + '}'
}

/**
 * @param element
 * @param importMap
 */
export async function renderServerNode(
  element: ReactElement,
  importMap: Map<unknown, string>,
): Promise<string> {
  if (element === undefined || element === null) return ''
  if (
    typeof element.type === 'function' &&
    element.type.constructor.name === 'AsyncFunction'
  ) {
    // async 일 경우 반드시 server component 이므로 바로 호출하여 결과를 반환합니다.
    const ret = await (element.type as any)(element.props)
    if (isElement(ret)) return await renderServerNode(ret, importMap)
    return ret
  }

  const elementName =
    (element as any).__DF_VAR ??
    (typeof element.type === 'string'
      ? element.type
      : typeof element.type === 'symbol'
        ? ''
        : importMap.has(element.type)
          ? importMap.get(element.type)
          : null)

  if (elementName === null) {
    // 서버 컴포넌트일 경우 호출합니다.
    const type = isForwardRef(element)
      ? (element.type as any).render
      : (element as any).type

    try {
      const ret = type(element.props)
      if (isElement(ret)) return renderServerNode(ret, importMap)
      return ret
    } catch (e) {
      console.error(e, type)
      return ''
    }
  }
  const { children, ...rest } = element.props
  return `<${elementName} ${(
    await Promise.all(
      Object.entries(rest).map(
        async ([key, value]) =>
          `${key}={${isElement(value) ? await renderServerNode(value, importMap) : JSON.stringify(value)}}`,
      ),
    )
  ).join(' ')}${
    children
      ? '>' +
        (
          await Promise.all(
            Children.map(children, async (child) => {
              return isElement(child)
                ? renderServerNode(child, importMap)
                : renderUnknownNode(child)
            }),
          )
        ).join('') +
        `</${elementName}>`
      : '/>'
  }`
}

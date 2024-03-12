import { generate } from 'astring'
import { createElement } from 'react'
import { Outlet } from 'react-router-dom'
import {
  type parseAst,
  parseAstAsync,
  transformWithEsbuild,
  ViteDevServer,
} from 'vite'

import { renderServerNode } from './renderer/render-server-node'

const exportMap = new Map()
/**
 * import mapping
 * @param server
 * @param id
 * @param ast
 * @param command
 */
export async function importMapping(
  server: ViteDevServer,
  id: string,
  ast: ReturnType<typeof parseAst>,
  command: 'build' | 'serve',
): Promise<Map<unknown, string>> {
  const importMap = new Map<unknown, string>()

  await Promise.all(
    ast.body.map(async (node) => {
      if (node.type !== 'ImportDeclaration') return
      const targetId = await server.pluginContainer
        .resolveId(node.source.value as string, id)
        .then((el) => el?.id)
      if (!targetId || targetId.startsWith('__')) return
      const module =
        server.moduleGraph.getModuleById(targetId)?.ssrModule ??
        (command === 'build' ? null : await server.ssrLoadModule(targetId))
      if (!module) return
      const mod = server.moduleGraph.getModuleById(targetId)!
      mod.ssrImportedModules.forEach((el) => {
        Object.entries(el.ssrModule as any).forEach(([value]) => {
          if (exportMap.has(value)) return
          exportMap.set(
            value,
            !!el.ssrTransformResult?.code?.includes('use client'),
          )
        })
      })
      Object.entries(mod.ssrModule as any).forEach(([, value]) => {
        if (exportMap.has(value)) return
        exportMap.set(
          value,
          !!mod.ssrTransformResult?.code?.includes('use client'),
        )
      })
      node.specifiers.forEach((el) => {
        if (el.type === 'ImportDefaultSpecifier') {
          if (exportMap.get(module.default))
            importMap.set(module.default, el.local.name)
        } else if (el.type === 'ImportSpecifier') {
          if (exportMap.get(module[el.imported.name]))
            importMap.set(module[el.imported.name], el.local.name)
        }
      })
    }),
  )
  return importMap
}
const IMPORT_OUTLET = 'import { Outlet } from "react-router-dom";'
const IMPORT_METADATA =
  'import { createMetadataElement } from "vite-plugin-next-app-router/client";'
export async function compile(
  server: ViteDevServer,
  id: string,
  code: string,
  command: 'build' | 'serve',
): Promise<string> {
  const { default: entry } = await server.ssrLoadModule(id).catch((e) => {
    throw new Error(`load error: ${e.message}`)
  })

  const { code: transCode } = await transformWithEsbuild(code, id)
  const ast = await parseAstAsync(transCode)
  const isLayout = /layout\.[jt]sx?$/.test(id)
  const outlet = createElement(Outlet)

  const entryElement = await entry({
    children: isLayout
      ? {
          ...outlet,
          __DF_VAR: 'Outlet',
        }
      : undefined,
    params: new Proxy(
      {},
      {
        get: (_, prop) => {
          return '__DF_VAR.params.' + prop.toString()
        },
      },
    ),
  })
  const importMap = await importMapping(server, id, ast, command)
  const retCode = await renderServerNode(entryElement, importMap).catch((e) => {
    throw new Error(`render error: ${e.message}`)
  })
  const entryComponentName = entry.name ?? (isLayout ? 'Layout' : 'Page')

  let hasMetadata = false

  ast.body = ast.body.filter((node) => {
    if (node.type === 'ImportDeclaration') {
      if (/\.css$/.test(String(node.source.value))) {
        // css 의 특수 import 를 제거하여 전체 import 가 되도록 유도합니다.
        node.specifiers = []
      }
    }
    if (node.type === 'ExportDefaultDeclaration') {
      return false
    }
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration?.type === 'FunctionDeclaration') {
        if (node.declaration.id?.name === 'generateStaticParams') return false
      }
      if (node.declaration?.type === 'VariableDeclaration') {
        node.declaration.declarations.forEach((el) => {
          if (!(el.id.type === 'Identifier' && el.id.name === 'metadata'))
            return el
          if (!el.init) return
          hasMetadata = true
          el.init = {
            type: 'CallExpression',
            optional: false,
            callee: {
              type: 'Identifier',
              name: 'createMetadataElement',
            },
            arguments: [el.init!],
          }
        })
      }
    }
    if (
      node.type === 'FunctionDeclaration' &&
      node.id?.name === entryComponentName
    ) {
      return false
    }
    if (node.type === 'VariableDeclaration') {
      const filteredNode = node.declarations.filter((el) => {
        return !(
          el.id.type === 'Identifier' && el.id.name === entryComponentName
        )
      })
      if (filteredNode.length === 0) return false
      node.declarations = filteredNode
      return true
    }
    return true
  })

  return (
    (hasMetadata ? IMPORT_METADATA + '\n' : '') +
    (isLayout ? IMPORT_OUTLET + '\n' : '') +
    (
      await transformWithEsbuild(
        generate(ast) +
          `\nexport default function ${entryComponentName}({ params }) { return ${retCode}; }\n`,
        id,
      )
    ).code
  )
}

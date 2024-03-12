/**
 * Convert file path to router path
 * The router path has a leading slash
 * @param filePath
 */
export function toRouterPath(filePath: string): string {
  return (
    '/' +
    filePath
      .replace(/^\/?src\/app\/?(.*)\/(page|layout)\.[jt]sx?$/, '$1')
      .replace(/\[([^\]]+)]/g, ':$1')
  )
}

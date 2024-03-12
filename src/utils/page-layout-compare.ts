export function pageLayoutCompare(a: string, b: string): number {
  const aPath = a.split('/')
  const bPath = b.split('/')
  const entryA = aPath.pop()
  bPath.pop()
  if (entryA && aPath.join('/') === bPath.join('/')) {
    const isLayout = /layout\.[jt]sx?$/.test(entryA)
    if (isLayout) return -1
    return 1
  }
  return aPath.length - bPath.length
}

/**
 * resolve manifest for build
 *
 * when you build, you need to resolve the manifest to get the correct order of js and css
 * that need for blocking layout shift
 * @param manifest
 * @param target
 */
export function resolveManifest(
  manifest: Record<
    string,
    {
      file: string
      src: string
      imports: string[]
      css: string[]
    }
  >,
  target: string,
): {
  js: string[]
  css: string[]
} {
  const css: Set<string> = new Set()
  const js: Set<string> = new Set()
  const queue = [target]
  const visited = new Set<string>()
  visited.add(target)

  while (queue.length > 0) {
    const current = queue.pop()!
    const entry = manifest[current]
    if (!entry) continue
    js.add(entry.file)
    if (entry.css) {
      entry.css.forEach((c) => css.add(c))
    }
    if (entry.imports) {
      entry.imports.forEach((i) => {
        if (visited.has(i)) return
        visited.add(i)
        queue.push(i)
      })
    }
  }

  return {
    js: Array.from(js),
    css: Array.from(css),
  }
}

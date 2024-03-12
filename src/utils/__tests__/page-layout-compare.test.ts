import { pageLayoutCompare } from '../page-layout-compare'
describe('pageLayoutCompare', () => {
  it('should sort', () => {
    expect(
      [
        '/src/app/layout.tsx',
        '/src/app/page.tsx',
        '/src/app/foo/layout.tsx',
        '/src/app/foo/page.tsx',
        '/src/app/foo/[id]/page.tsx',
        '/src/app/foo/[id]/ne/page.tsx',
        '/src/app/foo/[id]/layout.tsx',
      ].sort(pageLayoutCompare),
    ).toEqual([
      '/src/app/layout.tsx',
      '/src/app/page.tsx',
      '/src/app/foo/layout.tsx',
      '/src/app/foo/page.tsx',
      '/src/app/foo/[id]/layout.tsx',
      '/src/app/foo/[id]/page.tsx',
      '/src/app/foo/[id]/ne/page.tsx',
    ])
  })
})

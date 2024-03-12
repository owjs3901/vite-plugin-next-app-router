import { createRoutes } from '../create-routes'

describe('createRouterHandle', () => {
  it('should collect pages and layouts', () => {
    expect(
      createRoutes({
        'src/app/page.tsx': vi.fn(),
        'src/app/foo/page.tsx': vi.fn(),
        'src/app/foo/layout.tsx': vi.fn(),
        'src/app/layout.tsx': vi.fn(),
      }),
    ).toEqual([
      {
        path: '/',
        lazy: expect.any(Function),
        children: [
          {
            path: '',
            lazy: expect.any(Function),
          },
          {
            path: 'foo',
            lazy: expect.any(Function),
            children: [
              {
                path: '',
                lazy: expect.any(Function),
              },
            ],
          },
        ],
      },
    ])
  })
  it('should add jump layout', () => {
    expect(
      createRoutes({
        'src/app/page.tsx': vi.fn(),
        'src/app/foo/bar/page.tsx': vi.fn(),
        'src/app/foo/bar/[id]/page.tsx': vi.fn(),
        'src/app/foo/bar/[id]/next/page.tsx': vi.fn(),
        'src/app/foo/layout.tsx': vi.fn(),
        'src/app/layout.tsx': vi.fn(),
      }),
    ).toEqual([
      {
        path: '/',
        lazy: expect.any(Function),
        children: [
          {
            path: '',
            lazy: expect.any(Function),
          },
          {
            path: 'foo',
            lazy: expect.any(Function),
            children: [
              {
                path: 'bar',
                lazy: expect.any(Function),
              },
              {
                path: 'bar/:id',
                lazy: expect.any(Function),
              },
              {
                path: 'bar/:id/next',
                lazy: expect.any(Function),
              },
            ],
          },
        ],
      },
    ])
  })
})

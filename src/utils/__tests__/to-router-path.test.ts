import { toRouterPath } from '../to-router-path'

describe('toRouterPath', () => {
  it('should convert file path to router path', () => {
    for (const file of ['page', 'layout'])
      for (const extension of ['tsx', 'jsx', 'js', 'ts']) {
        expect(toRouterPath(`/src/app/pages/${file}.${extension}`)).toBe(
          '/pages',
        )
        expect(toRouterPath(`/src/app/${file}.${extension}`)).toBe('/')
        expect(toRouterPath(`src/app/foo/bar/${file}.${extension}`)).toBe(
          '/foo/bar',
        )
        expect(toRouterPath(`/src/app/[var]/${file}.${extension}`)).toBe(
          '/:var',
        )
        expect(
          toRouterPath(`/src/app/[var]/foo/bar/[bar2]/${file}.${extension}`),
        ).toBe('/:var/foo/bar/:bar2')
        expect(toRouterPath(`src/app/foo/[id]/${file}.${extension}`)).toBe(
          '/foo/:id',
        )
      }
  })
})

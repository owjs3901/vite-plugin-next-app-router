import * as index from '../index'

describe('export', () => {
  it('should export nextAppRouter', () => {
    expect({ ...index }).toEqual({
      nextAppRouter: expect.any(Function),
    })
  })
})

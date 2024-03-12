import * as index from '../index'

describe('export', () => {
  it('should export utils for the client', () => {
    expect({ ...index }).toEqual({
      createMetadataElement: expect.any(Function),
      createRoutes: expect.any(Function),
    })
  })
})

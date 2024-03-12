import { findNthIndex } from '../find-nth-index'

describe('findNthIndex', () => {
  it('should find nth index', () => {
    expect(findNthIndex('a.b.c.d', '.', 2)).toBe(3)
  })
  it('should find nth index that is not found', () => {
    expect(findNthIndex('a.b.c.d', '.', 4)).toBe(-1)
  })
  it('should return -1 when the target is not found', () => {
    expect(findNthIndex('a.b.c.d', 'e', 1)).toBe(-1)
  })
})

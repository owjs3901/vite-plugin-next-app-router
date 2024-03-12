import { isElement } from 'react-is'

import { createMetadataElement } from '../create-metadata-element'

describe('createMetadataElement', () => {
  it('should create default metadata element', () => {
    const result = createMetadataElement({})
    expect(isElement(result)).toBe(true)
    expect(result.props).toMatchObject({
      prioritizeSeoTags: true,
      meta: [
        {
          charset: 'utf-8',
        },
      ],
    })
  })
  it('should create metadata element with title', () => {
    const result = createMetadataElement({ title: 'test' })
    expect(isElement(result)).toBe(true)
    expect(result.props).toMatchObject({
      prioritizeSeoTags: true,
      meta: [
        {
          charset: 'utf-8',
        },
      ],
      title: 'test',
    })
  })
  it('should create metadata element with additional meta', () => {
    const result = createMetadataElement({
      title: 'test',
      meta: [
        {
          name: 'description',
          content: 'test',
        },
      ],
    })
    expect(isElement(result)).toBe(true)
    expect(result.props).toMatchObject({
      prioritizeSeoTags: true,
      meta: [
        {
          charset: 'utf-8',
        },
        {
          name: 'description',
          content: 'test',
        },
      ],
      title: 'test',
    })
  })
})

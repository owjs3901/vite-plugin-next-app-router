import { createElement, ReactElement } from 'react'
import * as ReactHelmet from 'react-helmet-async'

export function createMetadataElement(metaDataObject: any): ReactElement {
  return createElement(((ReactHelmet as any).default ?? ReactHelmet).Helmet, {
    prioritizeSeoTags: true,
    ...metaDataObject,
    meta: [
      {
        charset: 'utf-8',
      },
      ...(metaDataObject.meta ?? []),
    ],
  })
}

import { Helmet } from 'react-helmet-async'

import { renderHtml } from '../render-html'

describe('renderHtml', () => {
  it('should render html with development mode', () => {
    const element = (
      <>
        <head></head>
        <div>test</div>
      </>
    )
    const mode = 'development'
    const tail = ''
    const result = renderHtml(element, mode, tail)
    // in development mode, it should include entry script
    expect(result).toEqual(
      `<!DOCTYPE html><head><title data-rh="true"></title></head><div>test</div><script type='module' data-nar="entry" src='/_nar_entry'></script>`,
    )
  })
  it('should render html with production mode', () => {
    const element = (
      <>
        <head></head>
        <div>test</div>
      </>
    )
    const mode = 'production'
    const tail = ''
    const result = renderHtml(element, mode, tail)
    // in production mode, it should not include entry script
    expect(result).toEqual(
      `<!DOCTYPE html><head><title data-rh="true"></title></head><div>test</div>`,
    )
  })

  it('should render html with tail', () => {
    const element = (
      <>
        <head></head>
        <div>test</div>
      </>
    )
    const mode = 'production'
    const tail = '<div>tail</div>'
    const result = renderHtml(element, mode, tail)
    // it should include tail
    expect(result).toEqual(
      `<!DOCTYPE html><head><title data-rh="true"></title></head><div>test</div><div>tail</div>`,
    )
  })
  it('should render html with head code', () => {
    const element = (
      <html>
        <head></head>
        <body>
          <Helmet>
            <title>test</title>
          </Helmet>
        </body>
      </html>
    )
    const mode = 'production'
    const tail = ''
    const result = renderHtml(element, mode, tail)
    // it should include head code
    expect(result).toEqual(
      `<!DOCTYPE html><html><head><title data-rh="true">test</title></head><body></body></html>`,
    )
  })
})

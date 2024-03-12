import { resolveManifest } from '../resolve-manifest'

describe('resolveManifest', () => {
  it('should resolve manifest', () => {
    // Arrange
    const manifest = {
      'index.js': {
        file: 'index.js',
        src: 'index.js',
        imports: ['a.js', 'b.js'],
        css: ['index.css'],
      },
      'a.js': {
        file: 'a.js',
        src: 'a.js',
        imports: ['c.js'],
        css: ['a.css'],
      },
      'b.js': {
        file: 'b.js',
        src: 'b.js',
        imports: ['c.js'],
        css: ['b.css'],
      },
      'c.js': {
        file: 'c.js',
        src: 'c.js',
        imports: [],
        css: ['c.css'],
      },
    }
    const target = 'index.js'
    // Act
    const result = resolveManifest(manifest, target)
    // Assert
    expect(result.js).toEqual(
      expect.arrayContaining(['index.js', 'a.js', 'c.js', 'b.js']),
    )
    expect(result.css).toEqual(
      expect.arrayContaining(['index.css', 'a.css', 'c.css', 'b.css']),
    )
  })
  it('should resolve manifest with no imports', () => {
    // Arrange
    const manifest = {
      'index.js': {
        file: 'index.js',
        src: 'index.js',
        imports: [],
        css: ['index.css'],
      },
    }
    const target = 'index.js'
    // Act
    const result = resolveManifest(manifest, target)
    // Assert
    expect(result.js).toEqual(expect.arrayContaining(['index.js']))
    expect(result.css).toEqual(expect.arrayContaining(['index.css']))
  })
  it('should resolve manifest with circular imports', () => {
    // Arrange
    const manifest = {
      'index.js': {
        file: 'index.js',
        src: 'index.js',
        imports: ['a.js'],
        css: ['index.css'],
      },
      'a.js': {
        file: 'a.js',
        src: 'a.js',
        imports: ['index.js'],
        css: ['a.css'],
      },
    }
    const target = 'index.js'
    // Act
    const result = resolveManifest(manifest, target)
    // Assert
    expect(result.js).toEqual(expect.arrayContaining(['index.js', 'a.js']))
    expect(result.css).toEqual(expect.arrayContaining(['index.css', 'a.css']))
  })
  it('should resolve manifest with wrong target', () => {
    // Arrange
    const manifest = {
      'index.js': {
        file: 'index.js',
        src: 'index.js',
        imports: ['a.js'],
        css: ['index.css'],
      },
      'a.js': {
        file: 'a.js',
        src: 'a.js',
        imports: ['index.js'],
        css: ['a.css'],
      },
    }
    const target = 'b.js'
    // Act
    const result = resolveManifest(manifest, target)
    // Assert
    expect(result.js).toEqual([])
    expect(result.css).toEqual([])
  })
})

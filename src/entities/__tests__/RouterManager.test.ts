import { RouterManager } from '../RouterManager'

vi.mock('react-router-dom/server.mjs')
describe('RouterManager', () => {
  describe('vite server cache', () => {
    it('should cache RouterManager', () => {
      // Arrange
      const server = {} as any
      const command = 'serve'
      // Act
      expect(RouterManager.create(server, command)).toBe(
        RouterManager.create(server, command),
      )
      expect(RouterManager.create({} as any, command)).not.toBe(
        RouterManager.create(server, command),
      )
    })
  })
})

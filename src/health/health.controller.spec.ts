import { HealthController } from './health.controller'

describe('HealthController', () => {
  let controller: HealthController

  beforeEach(() => {
    controller = new HealthController()
  })

  describe('check', () => {
    it('should return health status', () => {
      const result = controller.check()
      expect(result.status).toBe('ok')
      expect(result.timestamp).toBeDefined()
      expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('live', () => {
    it('should return liveness status', () => {
      const result = controller.live()
      expect(result.status).toBe('ok')
      expect(result.timestamp).toBeDefined()
    })
  })

  describe('ready', () => {
    it('should return readiness status', () => {
      const result = controller.ready()
      expect(result.status).toBe('ready')
      expect(result.timestamp).toBeDefined()
    })
  })
})

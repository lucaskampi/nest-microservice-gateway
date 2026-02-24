import { JwtStrategy } from './jwt.strategy'

describe('JwtStrategy', () => {
  let strategy: JwtStrategy

  beforeEach(() => {
    strategy = new JwtStrategy()
  })

  it('should be defined', () => {
    expect(strategy).toBeDefined()
  })

  describe('validate', () => {
    it('should return user payload with userId, email, and role', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      }

      const result = await strategy.validate(payload)

      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user',
      })
    })

    it('should handle payload with missing optional fields', async () => {
      const payload = {
        sub: 'user-456',
        email: 'admin@example.com',
      }

      const result = await strategy.validate(payload)

      expect(result).toEqual({
        userId: 'user-456',
        email: 'admin@example.com',
        role: undefined,
      })
    })
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

describe('Gateway E2E Tests', () => {
  let app: INestApplication
  let authToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ transform: true }))
    
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Health Endpoints', () => {
    it('GET /api/health should return ok', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok')
        })
    })

    it('GET /api/health/live should return ok', () => {
      return request(app.getHttpServer())
        .get('/api/health/live')
        .expect(200)
    })

    it('GET /api/health/ready should return ready', () => {
      return request(app.getHttpServer())
        .get('/api/health/ready')
        .expect(200)
    })
  })

  describe('Authentication', () => {
    it('POST /api/auth/register should register a new user', () => {
      const randomEmail = `test-${Date.now()}@example.com`
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: randomEmail,
          password: 'password123',
        })
        .expect(201)
    })

    it('POST /api/auth/login should login and return token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.access_token).toBeDefined()
          authToken = res.body.access_token
        })
    })
  })

  describe('Products (Public)', () => {
    it('GET /api/products should return products', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
    })

    it('GET /api/products/:id should return a product', () => {
      return request(app.getHttpServer())
        .get('/api/products/1')
        .expect(200)
    })
  })

  describe('Purchases (Protected)', () => {
    it('POST /api/purchases without auth should return 401', () => {
      return request(app.getHttpServer())
        .post('/api/purchases')
        .send({
          items: [{ id: 1, amount: 2 }],
          address: {
            street: 'Main St',
            number: 123,
            state: 'SP',
          },
        })
        .expect(401)
    })

    it('POST /api/purchases with valid token should create purchase', () => {
      return request(app.getHttpServer())
        .post('/api/purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ id: 1, amount: 2 }],
          address: {
            street: 'Main St',
            number: 123,
            state: 'SP',
          },
        })
        .expect(201)
        .then((res) => {
          expect(res.body.id).toBeDefined()
          expect(res.body.state).toBeDefined()
        })
    })

    it('GET /api/purchases with valid token should return purchases', () => {
      return request(app.getHttpServer())
        .get('/api/purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true)
        })
    })
  })

  describe('Auth Profile', () => {
    it('GET /api/auth/profile without token should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401)
    })

    it('GET /api/auth/profile with valid token should return user', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
    })
  })
})

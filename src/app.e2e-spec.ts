import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from './app.module'
import { HttpService } from '@nestjs/axios'
import { of } from 'rxjs'

describe('Gateway E2E Tests', () => {
  let app: INestApplication
  let httpService: HttpService

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
    request: jest.fn(),
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ transform: true }))
    
    httpService = moduleFixture.get<HttpService>(HttpService)
    
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockHttpService.post.mockImplementation((url: string) => {
      if (url.includes('/auth/register')) {
        return of({
          data: { id: '1', email: 'test@example.com' },
          status: 201,
        })
      }
      if (url.includes('/auth/login')) {
        return of({
          data: { access_token: 'mock-jwt-token-12345' },
          status: 200,
        })
      }
      return of({ data: {}, status: 404 })
    })

    mockHttpService.get.mockImplementation((url: string) => {
      if (url.includes('/products')) {
        return of({
          data: [{ id: 1, name: 'Product 1', price: 100 }],
          status: 200,
        })
      }
      return of({ data: {}, status: 404 })
    })

    mockHttpService.request.mockImplementation((config: any) => {
      const url = config.url || ''
      if (url.includes('/products')) {
        return of({
          data: [{ id: 1, name: 'Product 1', price: 100 }],
          status: 200,
        })
      }
      return of({ data: {}, status: 404 })
    })
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

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', () => {
      return request(app.getHttpServer())
        .get('/api/unknown')
        .expect(404)
    })
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { HttpService } from '@nestjs/axios'
import { AuthController } from './auth.controller'
import { HttpException, HttpStatus } from '@nestjs/common'
import { of, throwError } from 'rxjs'

describe('AuthController', () => {
  let controller: AuthController
  let httpService: HttpService

  const mockHttpService = {
    post: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    httpService = module.get<HttpService>(HttpService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('register', () => {
    const registerDto = { email: 'test@example.com', password: 'password123' }
    const mockResponse = {
      data: { id: '1', email: 'test@example.com' },
      status: 201,
    }

    it('should register a new user successfully', async () => {
      mockHttpService.post.mockReturnValueOnce(of(mockResponse))

      const result = await controller.register(registerDto)

      expect(result).toEqual(mockResponse.data)
      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        registerDto
      )
    })

    it('should throw HttpException when auth service returns error', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Email already exists' },
        },
      }
      mockHttpService.post.mockReturnValueOnce(throwError(() => errorResponse))

      await expect(controller.register(registerDto)).rejects.toThrow(HttpException)
    })

    it('should throw HttpException with default status when error has no response', async () => {
      mockHttpService.post.mockReturnValueOnce(throwError(() => ({ message: 'Network error' })))

      try {
        await controller.register(registerDto)
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        const httpError = error as HttpException
        expect(httpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
        expect(httpError.getResponse()).toBe('Auth service error')
      }
    })

    it('should use custom AUTH_SERVICE_URL when set', async () => {
      const originalEnv = process.env.AUTH_SERVICE_URL
      process.env.AUTH_SERVICE_URL = 'http://custom-auth:4088/api'

      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
        ],
      }).compile()

      const customController = module.get<AuthController>(AuthController)

      const mockResponse = {
        data: { id: '1', email: 'test@example.com' },
        status: 201,
      }
      mockHttpService.post.mockReturnValueOnce(of(mockResponse))

      await customController.register(registerDto)

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://custom-auth:4088/api/auth/register',
        registerDto
      )

      if (originalEnv) {
        process.env.AUTH_SERVICE_URL = originalEnv
      } else {
        delete process.env.AUTH_SERVICE_URL
      }
    })
  })

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' }
    const mockResponse = {
      data: { access_token: 'jwt-token-123' },
      status: 200,
    }

    it('should login successfully and return token', async () => {
      mockHttpService.post.mockReturnValueOnce(of(mockResponse))

      const result = await controller.login(loginDto)

      expect(result).toEqual(mockResponse.data)
      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        loginDto
      )
    })

    it('should throw HttpException when login fails', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      }
      mockHttpService.post.mockReturnValueOnce(throwError(() => errorResponse))

      await expect(controller.login(loginDto)).rejects.toThrow(HttpException)
    })

    it('should throw generic error when auth service is unavailable', async () => {
      mockHttpService.post.mockReturnValueOnce(throwError(() => new Error('Connection refused')))

      try {
        await controller.login(loginDto)
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        const httpError = error as HttpException
        expect(httpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      }
    })

    it('should throw HttpException with default status when error has no response', async () => {
      mockHttpService.post.mockReturnValueOnce(throwError(() => ({ message: 'Network error' })))

      try {
        await controller.login(loginDto)
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        const httpError = error as HttpException
        expect(httpError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
        expect(httpError.getResponse()).toBe('Auth service error')
      }
    })
  })
})

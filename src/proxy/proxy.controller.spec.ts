import { Test, TestingModule } from '@nestjs/testing'
import { ProxyController } from './proxy.controller'
import { HttpService } from '@nestjs/axios'
import { HttpException, HttpStatus } from '@nestjs/common'
import { of, throwError } from 'rxjs'
import { Request, Response } from 'express'

describe('ProxyController', () => {
  let controller: ProxyController
  let httpService: HttpService

  const mockHttpService = {
    request: jest.fn(),
  }

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response

  const mockRequest = {
    method: 'GET',
    path: '/products',
    body: {},
    query: {},
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer token',
    },
  } as unknown as Request

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile()

    controller = module.get<ProxyController>(ProxyController)
    httpService = module.get<HttpService>(HttpService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('proxyProducts', () => {
    it('should forward request to store service', async () => {
      const mockAxiosResponse = of({
        data: [{ id: 1, name: 'Product 1' }],
        status: 200,
      })

      mockHttpService.request.mockReturnValueOnce(mockAxiosResponse)

      await controller.proxyProducts(mockRequest, mockResponse)

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('http://localhost:4000/api/products'),
        })
      )
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith([{ id: 1, name: 'Product 1' }])
    })

    it('should forward request with query params', async () => {
      const requestWithQuery = {
        ...mockRequest,
        query: { page: '1', limit: '10' },
      } as unknown as Request

      const mockAxiosResponse = of({
        data: [],
        status: 200,
      })
      mockHttpService.request.mockReturnValueOnce(mockAxiosResponse)

      await controller.proxyProducts(requestWithQuery, mockResponse)

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { page: '1', limit: '10' },
        })
      )
    })
  })

  describe('proxyPurchases', () => {
    it('should forward request to store service for purchases', async () => {
      const purchasesRequest = {
        ...mockRequest,
        path: '/purchases',
      } as unknown as Request

      const mockAxiosResponse = of({
        data: [{ id: 1, state: 'pending' }],
        status: 201,
      })
      mockHttpService.request.mockReturnValueOnce(mockAxiosResponse)

      await controller.proxyPurchases(purchasesRequest, mockResponse)

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('http://localhost:4000/api/purchases'),
        })
      )
    })
  })

  describe('proxySupplier', () => {
    it('should forward request to supplier service with modified path', async () => {
      const supplierRequest = {
        ...mockRequest,
        path: '/supplier/orders',
      } as unknown as Request

      const mockAxiosResponse = of({
        data: [{ id: 1, orderId: 'ORD-001' }],
        status: 200,
      })
      mockHttpService.request.mockReturnValueOnce(mockAxiosResponse)

      await controller.proxySupplier(supplierRequest, mockResponse)

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('http://localhost:4001/api/orders'),
        })
      )
    })
  })

  describe('proxyCarrier', () => {
    it('should forward request to carrier service with modified path', async () => {
      const carrierRequest = {
        ...mockRequest,
        path: '/carrier/deliveries',
      } as unknown as Request

      const mockAxiosResponse = of({
        data: [{ id: 1, tracking: 'TRACK-001' }],
        status: 200,
      })
      mockHttpService.request.mockReturnValueOnce(mockAxiosResponse)

      await controller.proxyCarrier(carrierRequest, mockResponse)

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('http://localhost:4002/api/deliveries'),
        })
      )
    })
  })

  describe('forwardRequest error handling', () => {
    it('should throw HttpException when service URL is invalid', async () => {
      const customController = new ProxyController(httpService)
      const requestWithInvalidPath = {
        ...mockRequest,
        path: '/supplier/test',
      } as unknown as Request

      const originalUrls = (customController as any).serviceUrls
      ;(customController as any).serviceUrls = { supplier: undefined }

      try {
        await customController.proxySupplier(requestWithInvalidPath, mockResponse)
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND)
      } finally {
        ;(customController as any).serviceUrls = originalUrls
      }
    })

    it('should handle service errors and propagate them', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      }
      mockHttpService.request.mockReturnValueOnce(throwError(() => errorResponse))

      try {
        await controller.proxyProducts(mockRequest, mockResponse)
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      }
    })

    it('should handle errors without response and return BAD_GATEWAY', async () => {
      mockHttpService.request.mockReturnValueOnce(throwError(() => ({ message: 'Service unavailable' })))

      try {
        await controller.proxyProducts(mockRequest, mockResponse)
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        expect(error.getStatus()).toBe(HttpStatus.BAD_GATEWAY)
        expect(error.getResponse()).toBe('Service unavailable')
      }
    })

    it('should use custom service URLs from environment', async () => {
      const originalEnv = { ...process.env }
      process.env.STORE_SERVICE_URL = 'http://custom-store:4000/api'
      process.env.SUPPLIER_SERVICE_URL = 'http://custom-supplier:4001/api'
      process.env.CARRIER_SERVICE_URL = 'http://custom-carrier:4002/api'

      const customController = new ProxyController(httpService)

      const mockAxiosResponse = of({
        data: [],
        status: 200,
      })
      mockHttpService.request.mockReturnValueOnce(mockAxiosResponse)

      await customController.proxyProducts(mockRequest, mockResponse)

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://custom-store:4000/api/products',
        })
      )

      process.env.STORE_SERVICE_URL = originalEnv.STORE_SERVICE_URL
      process.env.SUPPLIER_SERVICE_URL = originalEnv.SUPPLIER_SERVICE_URL
      process.env.CARRIER_SERVICE_URL = originalEnv.CARRIER_SERVICE_URL
    })

    it('should forward POST request with body data', async () => {
      const postRequest = {
        ...mockRequest,
        method: 'POST',
        path: '/products',
        body: { name: 'New Product', price: 100 },
      } as unknown as Request

      const mockAxiosResponse = of({
        data: { id: 1, name: 'New Product' },
        status: 201,
      })
      mockHttpService.request.mockReturnValueOnce(mockAxiosResponse)

      await controller.proxyProducts(postRequest, mockResponse)

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: { name: 'New Product', price: 100 },
        })
      )
    })

    it('should remove host header from forwarded request', async () => {
      const requestWithHost = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          host: 'localhost:5000',
        },
      } as unknown as Request

      const mockAxiosResponse = of({
        data: [],
        status: 200,
      })
      mockHttpService.request.mockReturnValueOnce(mockAxiosResponse)

      await controller.proxyProducts(requestWithHost, mockResponse)

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            host: undefined,
          })
        })
      )
    })
  })
})

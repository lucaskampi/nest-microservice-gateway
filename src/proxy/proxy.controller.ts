import { 
  Controller, 
  All, 
  Req, 
  Res, 
  HttpException, 
  HttpStatus,
  UseGuards,
  Logger
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { HttpService } from '@nestjs/axios'
import { Request, Response } from 'express'
import { firstValueFrom } from 'rxjs'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('proxy')
@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name)
  private readonly serviceUrls: Record<string, string>

  constructor(private readonly httpService: HttpService) {
    this.serviceUrls = {
      store: process.env.STORE_SERVICE_URL || 'http://localhost:4000/api',
      supplier: process.env.SUPPLIER_SERVICE_URL || 'http://localhost:4001/api',
      carrier: process.env.CARRIER_SERVICE_URL || 'http://localhost:4002/api',
    }
  }

  // Public routes - no auth required
  @All(['products', 'products/*'])
  async proxyProducts(@Req() req: Request, @Res() res: Response) {
    return this.forwardRequest(req, res, 'store')
  }

  // Protected routes - require authentication
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @All(['purchases', 'purchases/*'])
  async proxyPurchases(@Req() req: Request, @Res() res: Response) {
    return this.forwardRequest(req, res, 'store')
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @All(['supplier/*'])
  async proxySupplier(@Req() req: Request, @Res() res: Response) {
    const path = req.path.replace('/supplier', '')
    return this.forwardRequest(req, res, 'supplier', path)
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @All(['carrier/*'])
  async proxyCarrier(@Req() req: Request, @Res() res: Response) {
    const path = req.path.replace('/carrier', '')
    return this.forwardRequest(req, res, 'carrier', path)
  }

  private async forwardRequest(
    req: Request,
    res: Response,
    service: string,
    customPath?: string
  ) {
    const targetUrl = this.serviceUrls[service]
    if (!targetUrl) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND)
    }

    const path = customPath || req.path
    const url = `${targetUrl}${path}`
    
    this.logger.log(`Proxying ${req.method} ${req.path} -> ${url}`)

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method,
          url,
          data: req.body,
          params: req.query,
          headers: {
            ...req.headers,
            host: undefined, // Remove original host header
          },
        })
      )

      res.status(response.status).json(response.data)
    } catch (error: any) {
      this.logger.error(`Proxy error: ${error.message}`)
      throw new HttpException(
        error.response?.data || 'Service unavailable',
        error.response?.status || HttpStatus.BAD_GATEWAY
      )
    }
  }
}

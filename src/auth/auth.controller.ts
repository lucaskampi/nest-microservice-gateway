import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { firstValueFrom } from 'rxjs'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly authServiceUrl: string

  constructor(private readonly httpService: HttpService) {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4088/api'
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  async register(@Body() body: { email: string; password: string }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/register`, body)
      )
      return response.data
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Auth service error',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'Returns JWT token' })
  async login(@Body() body: { email: string; password: string }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/login`, body)
      )
      return response.data
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Auth service error',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}

import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ThrottlerModule } from '@nestjs/throttler'
import { ProxyController } from './proxy/proxy.controller'
import { AuthController } from './auth/auth.controller'
import { JwtStrategy } from './auth/jwt.strategy'
import { HealthModule } from './health/health.module'

@Module({
  imports: [
    HttpModule,
    PassportModule,
    HealthModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    }),
  ],
  controllers: [ProxyController, AuthController],
  providers: [JwtStrategy],
})
export class AppModule {}

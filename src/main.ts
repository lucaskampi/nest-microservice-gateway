import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.enableCors()

  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('Microservices API Gateway')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const port = process.env.PORT || 5000
  await app.listen(port)
  console.log(`🚪 API Gateway running on http://localhost:${port}`)
  console.log(`📚 Swagger docs at http://localhost:${port}/docs`)
}

bootstrap()

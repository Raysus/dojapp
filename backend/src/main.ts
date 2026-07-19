import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger, ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
import { AllExceptionsFilter } from './common/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  if (process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1)
  }

  const defaultOrigins = [
    'http://localhost:5173',
    'https://localhost',
    'capacitor://localhost',
    'http://localhost',
  ]

  const allowedOrigins = (process.env.CORS_ORIGIN ?? defaultOrigins.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.useGlobalFilters(new AllExceptionsFilter())

  const port = Number(process.env.PORT ?? 3000)
  const host = process.env.HOST ?? '0.0.0.0'
  await app.listen(port, host)
  Logger.log(`API listening on http://${host}:${port}`, 'Bootstrap')
}
bootstrap();

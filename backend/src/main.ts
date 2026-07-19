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
    'http://127.0.0.1:5173',
    'https://localhost',
    'capacitor://localhost',
    'http://localhost',
    'http://127.0.0.1',
  ]

  const allowedOrigins = (process.env.CORS_ORIGIN ?? defaultOrigins.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const isDev = process.env.NODE_ENV !== 'production'

  app.enableCors({
    origin: (origin, callback) => {
      // Same-origin / curl / native Capacitor may omit Origin
      if (!origin) {
        callback(null, true)
        return
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      // Local Vite (any port) during development
      if (
        isDev &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        callback(null, true)
        return
      }
      callback(new Error(`CORS blocked for origin: ${origin}`), false)
    },
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

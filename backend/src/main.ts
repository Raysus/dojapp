import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Detrás de Nginx/Caddy/Cloudflare en producción HTTPS
  if (process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1)
  }

  // CORS: configurable por env (comma-separated).
  // Incluye orígenes web (Vite) y Capacitor (APK).
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

  const port = Number(process.env.PORT ?? 3000)
  const host = process.env.HOST ?? '0.0.0.0'
  await app.listen(port, host)
}
bootstrap();

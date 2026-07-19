import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  // Fail early in production-like boots; tests can set JWT_SECRET in env.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing JWT_SECRET environment variable');
  }
}

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecret ?? 'dev-only-jwt-secret-change-me',
      signOptions: {
        expiresIn: 60 * 60 * 2,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

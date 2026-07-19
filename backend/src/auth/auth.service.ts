import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { createHash, randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { UserRole } from '@prisma/client'

type TokenUser = {
  sub: string
  email: string
  role: UserRole
}

const ACCESS_TTL_SEC = 60 * 60 * 2
const REFRESH_TTL_SEC = 60 * 60 * 24 * 30

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  private signAccess(user: TokenUser) {
    return this.jwtService.sign(
      { ...user, type: 'access' as const },
      { expiresIn: ACCESS_TTL_SEC },
    )
  }

  private signRefresh(user: TokenUser) {
    return this.jwtService.sign(
      { ...user, type: 'refresh' as const, jti: randomUUID() },
      { expiresIn: REFRESH_TTL_SEC },
    )
  }

  private async persistRefresh(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken)
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000)
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    })
  }

  private async tokensFor(user: TokenUser) {
    const access_token = this.signAccess(user)
    const refresh_token = this.signRefresh(user)
    await this.persistRefresh(user.sub, refresh_token)
    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: ACCESS_TTL_SEC,
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    return this.tokensFor({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{
        sub: string
        email: string
        role: UserRole
        type?: string
      }>(refreshToken)

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Refresh token inválido')
      }

      const tokenHash = this.hashToken(refreshToken)
      const stored = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
      })

      if (!stored || stored.revokedAt || stored.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Refresh token inválido o expirado')
      }

      // Rotate: revoke current token
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      })

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      })

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado')
      }

      return this.tokensFor({
        sub: user.id,
        email: user.email,
        role: user.role,
      })
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err
      this.logger.warn(`Refresh falló: ${(err as Error).message}`)
      throw new UnauthorizedException('Refresh token inválido o expirado')
    }
  }

  async logout(refreshToken?: string, userId?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken)
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      return { ok: true }
    }

    if (userId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }

    return { ok: true }
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable')
}

type JwtPayload = {
  sub: string
  email: string
  role: UserRole
  type?: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    })
  }

  async validate(payload: JwtPayload) {
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Token de acceso requerido')
    }
    return payload
  }
}

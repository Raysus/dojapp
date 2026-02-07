import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { UserRole } from '@prisma/client'

@Injectable()
export class AuthService {
  assertDojoRole(performedById: string, dojoId: string, arg2: ("INSTRUCTOR" | "PROFESSOR")[]) {
    throw new Error('Method not implemented.')
  }
  assertProfessorInDojo(sub: string, dojoId: string, role: string) {
    throw new Error('Method not implemented.')
  }
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

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

    const payload: {
      sub: string
      email: string
      role: UserRole
    } = {
      sub: user.id,
      email: user.email,
      role: user.role,
    }

    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}

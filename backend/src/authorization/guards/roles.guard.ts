import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { UserRole } from '@prisma/client'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredRoles || requiredRoles.length === 0) return true

    const req = context.switchToHttp().getRequest()
    const user = req.user

    if (!user) {
      throw new UnauthorizedException('No autenticado')
    }

    if (!user.role) {
      throw new UnauthorizedException('Token inválido (sin rol)')
    }

    const ok = requiredRoles.includes(user.role)
    if (!ok) throw new ForbiddenException('No tienes permisos')

    return true
  }
}
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthorizationService } from '../authorization.service'
import { DOJO_ROLES_KEY } from '../decorators/dojo-roles.decorator'
import { DojoRole } from '@prisma/client'

@Injectable()
export class DojoRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authz: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles =
      this.reflector.get<DojoRole[]>(DOJO_ROLES_KEY, context.getHandler()) ||
      []

    const request = context.switchToHttp().getRequest()
    const userId = request.user?.sub

    const dojoId =
      request.params?.dojoId ?? request.body?.dojoId ?? request.query?.dojoId

    await this.authz.assertUserInDojo(userId, dojoId, roles)

    return true
  }
}

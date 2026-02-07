import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthorizationService } from '../authorization.service'
import { DOJO_ROLES_KEY } from '../decorators/dojo-roles.decorator'
import { DojoRole, UserRole } from '@prisma/client'

@Injectable()
export class DojoRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authz: AuthorizationService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles =
      this.reflector.get<DojoRole[]>(
        'dojo_roles',
        context.getHandler(),
      ) || [];

    const request = context.switchToHttp().getRequest();
    const userId = request.user.sub;
    const dojoId = request.params.dojoId;

    await this.authz.assertUserInDojo(userId, dojoId, roles);

    return true;
  }
}

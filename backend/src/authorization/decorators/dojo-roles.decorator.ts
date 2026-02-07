import { SetMetadata } from '@nestjs/common'
import { DojoRole } from '@prisma/client'

export const DOJO_ROLES_KEY = 'dojo_roles'

export const DojoRoles = (...roles: DojoRole[]) =>
  SetMetadata('dojo_roles', roles);

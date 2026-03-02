import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthorizationController } from './authorization.controller'
import { AuthorizationService } from './authorization.service'
import { PermissionsService } from './permissions.service'

@Module({
  imports: [PrismaModule],
  controllers: [AuthorizationController],
  providers: [PermissionsService, AuthorizationService],
  exports: [PermissionsService, AuthorizationService],
})
export class AuthorizationModule {}

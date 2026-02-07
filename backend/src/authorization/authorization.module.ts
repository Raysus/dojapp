import { Module } from '@nestjs/common'
import { AuthorizationService } from './authorization.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthorizationController } from './authorization.controller'

@Module({
    imports: [PrismaModule],
    controllers: [AuthorizationController],
    providers: [AuthorizationService],
    exports: [AuthorizationService],
})
export class AuthorizationModule { }

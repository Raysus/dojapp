import { Module } from '@nestjs/common'
import { AttendanceController } from './attendance.controller'
import { AttendanceService } from './attendance.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthorizationModule } from '../authorization/authorization.module'

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { HealthModule } from './health/health.module'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { DojosModule } from './dojos/dojos.module'
import { StudentsModule } from './students/students.module'
import { ContentsModule } from './contents/contents.module'
import { AuthorizationModule } from './authorization/authorization.module'
import { APP_GUARD } from '@nestjs/core'
import { RolesGuard } from './authorization/guards/roles.guard'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { AttendanceModule } from './attendance/attendance.module'
import { MetricsModule } from './metrics/metrics.module'
import { AdminModule } from './admin/admin.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    DojosModule,
    StudentsModule,
    ContentsModule,
    AuthorizationModule,
    AttendanceModule,
    MetricsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common'
import { MetricsService } from './metrics.service'
import { MetricsController } from './metrics.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthorizationModule } from '../authorization/authorization.module'

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}

import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common'
import { DojoRole } from '@prisma/client'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { DojoRoles } from 'src/authorization/decorators/dojo-roles.decorator'
import { DojoRoleGuard } from 'src/authorization/guards/dojo-role.guard'
import { MetricsService } from './metrics.service'

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @UseGuards(JwtAuthGuard, DojoRoleGuard)
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  @Get('dojos/:dojoId/metrics')
  getMetrics(@Param('dojoId') dojoId: string, @Req() req) {
    return this.metricsService.getDojoMetrics(req.user.sub, dojoId)
  }
}

import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common'
import { AttendanceService } from './attendance.service'
import { MarkAttendanceDto } from './dto/mark-attendance.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { DojoRole } from '@prisma/client'
import { DojoRoles } from '../authorization/decorators/dojo-roles.decorator'
import { DojoRoleGuard } from '../authorization/guards/dojo-role.guard'

@Controller('dojos/:dojoId/attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    @UseGuards(JwtAuthGuard, DojoRoleGuard)
    @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
    @Get()
    getForDate(
        @Param('dojoId') dojoId: string,
        @Query('date') date: string | undefined,
        @Req() req,
    ) {
        return this.attendanceService.getAttendanceForDate(dojoId, req.user.sub, date)
    }

    @UseGuards(JwtAuthGuard, DojoRoleGuard)
    @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
    @Post()
    async markAttendance(
        @Param('dojoId') dojoId: string,
        @Body() items: MarkAttendanceDto[],
        @Req() req,
    ) {
        const takenById = req.user.sub

        return Promise.all(
            items.map((item) =>
                this.attendanceService.markAttendance({
                    dojoId,
                    userId: item.userId,
                    present: item.present,
                    takenById,
                    date: item.date ? new Date(item.date) : undefined,
                }),
            ),
        )
    }

    @UseGuards(JwtAuthGuard, DojoRoleGuard)
    @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
    @Get('metrics')
    getMetrics(@Param('dojoId') dojoId: string, @Req() req) {
        return this.attendanceService.getAttendanceMetrics(dojoId, req.user.sub)
    }
}

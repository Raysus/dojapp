import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common'
import { AttendanceService } from './attendance.service'
import { MarkAttendanceDto } from './dto/mark-attendance.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('dojos/:dojoId/attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

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

    @Get('metrics')
    getMetrics(@Param('dojoId') dojoId: string) {
        return this.attendanceService.getAttendanceMetrics(dojoId)
    }
}

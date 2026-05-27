import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Roles } from '../authorization/decorators/roles.decorator'
import { StudentsService } from './students.service'

/**
 * Student self-service endpoints.
 *
 * Dojo-scoped professor/instructor actions live in DojoStudentsController.
 */
@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me')
  @Roles(UserRole.STUDENT)
  getMe(@Req() req) {
    return this.studentsService.getMyInfo(req.user.sub)
  }

  @Get('me/contents')
  @Roles(UserRole.STUDENT)
  getMyContents(@Req() req) {
    return this.studentsService.getAvailableContents(req.user.sub)
  }

  /**
   * Marks content as completed for the logged-in student (idempotent).
   */
  @Post('me/contents/:contentId/complete')
  @Roles(UserRole.STUDENT)
  completeMyContent(@Param('contentId') contentId: string, @Req() req) {
    return this.studentsService.completeContentForStudent(req.user.sub, contentId)
  }

  @Get('me/stats')
  @Roles(UserRole.STUDENT)
  getMyStats(@Req() req) {
    return this.studentsService.getMyStats(req.user.sub)
  }
}

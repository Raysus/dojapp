import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { DojoRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DojoRoles } from '../authorization/decorators/dojo-roles.decorator';
import { DojoRoleGuard } from '../authorization/guards/dojo-role.guard';
import { AssignGradeDto } from './dto/assign-grade.dto';
import { StudentsService } from './students.service';

@Controller('dojos/:dojoId/students')
@UseGuards(JwtAuthGuard, DojoRoleGuard)
export class DojoStudentsController {
  constructor(private readonly studentsService: StudentsService) { }

  @Get(':studentId')
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  getStudentDetail(
    @Param('dojoId') dojoId: string,
    @Param('studentId') studentId: string,
    @Req() req,
  ) {
    return this.studentsService.getByIdForProfessor(studentId, dojoId, req.user);
  }

  @Get(':studentId/contents')
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  getStudentVisibleContents(
    @Param('dojoId') dojoId: string,
    @Param('studentId') studentId: string,
    @Req() req,
  ) {
    return this.studentsService.getVisibleContentsForStudentInDojo(studentId, dojoId, req.user);
  }

  @Post(':studentId/promote')
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  promoteStudent(
    @Param('dojoId') dojoId: string,
    @Param('studentId') studentId: string,
    @Body('gradeId') gradeId: string,
    @Req() req,
  ) {
    if (!gradeId) throw new BadRequestException('gradeId is required');
    return this.studentsService.promoteStudent(dojoId, studentId, gradeId, req.user.sub);
  }

  @Patch(':studentId/grade')
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  assignGrade(
    @Param('dojoId') dojoId: string,
    @Param('studentId') studentId: string,
    @Body() dto: AssignGradeDto,
    @Req() req,
  ) {
    if (!dto?.gradeId) throw new BadRequestException('gradeId is required');
    return this.studentsService.assignGradeToStudent(req.user.sub, dojoId, studentId, dto.gradeId);
  }

  @Post(':studentId/contents/toggle')
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  toggleStudentContent(
    @Param('dojoId') dojoId: string,
    @Param('studentId') studentId: string,
    @Body('contentId') contentId: string,
    @Req() req,
  ) {
    if (!contentId) throw new BadRequestException('contentId is required');
    return this.studentsService.toggleStudentContent(req.user.sub, dojoId, studentId, contentId);
  }
}

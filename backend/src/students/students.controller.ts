import { Controller, Get, Req, UseGuards, Post, Body, Param, Put, Patch, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Roles } from '../authorization/decorators/roles.decorator';
import { RolesGuard } from '../authorization/guards/roles.guard';
import { DojoRole, UserRole } from '@prisma/client';
import { DojoRoleGuard } from 'src/authorization/guards/dojo-role.guard';
import { DojoRoles } from 'src/authorization/decorators/dojo-roles.decorator';
import { AssignGradeDto } from './dto/assign-grade.dto';
import { UpdateStudentGradeDto } from './dto/update-student-grade.dto';

@Controller('dojos/:dojoId/students')
@UseGuards(JwtAuthGuard, DojoRoleGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) { }

  @Get('me')
  @Roles('STUDENT')
  getMe(@Req() req) {
    return this.studentsService.getMyInfo(req.user.sub);
  }
  @UseGuards(JwtAuthGuard, DojoRoleGuard)
  @DojoRoles(DojoRole.PROFESSOR)
  @Get(':dojoId/:studentId')
  getStudentForProfessor(
    @Param('dojoId') dojoId: string,
    @Param('studentId') studentId: string,
    @Req() req
  ) {
    return this.studentsService.getByIdForProfessor(
      studentId,
      dojoId,
      req.user
    )
  }

  @Post(':dojoId/:studentId/promote')
  @UseGuards(JwtAuthGuard, DojoRoleGuard)
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  promoteStudent(
    @Param('dojoId') dojoId: string,
    @Param('studentId') studentId: string,
    @Body('gradeId') gradeId: string,
    @Req() req
  ) {
    return this.studentsService.promoteStudent(
      dojoId,
      studentId,
      gradeId,
      req.user.sub
    );
  }

  @Patch(':dojoId/:studentId/grade')
  @Roles(UserRole.PROFESSOR)
  updateGrade(
    @Param('dojoId') dojoId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateStudentGradeDto,
    @Req() req,
  ) {
    return this.studentsService.updateGrade(
      dojoId,
      studentId,
      dto.gradeId,
      req.user.sub,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/contents')
  getMyContents(@Req() req) {
    return this.studentsService.getAvailableContents(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, DojoRoleGuard)
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  @Patch('dojos/:dojoId/students/:studentId/grade')
  assignGrade(
    @Param('dojoId') dojoId: string,
    @Param('studentId') studentId: string,
    @Body() dto: AssignGradeDto,
    @Req() req,
  ) {
    return this.studentsService.assignGradeToStudent(
      req.user.sub,
      dojoId,
      studentId,
      dto.gradeId,
    );
  }
}

import { Controller, Get, Param, Post, Body, Req, UseGuards } from '@nestjs/common';
import { DojoRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DojoRoles } from '../authorization/decorators/dojo-roles.decorator';
import { DojoRoleGuard } from '../authorization/guards/dojo-role.guard';
import { CreateContentDto } from './dto/create-content.dto';
import { ContentsService } from './contents.service';

@Controller('dojos/:dojoId/contents')
@UseGuards(JwtAuthGuard, DojoRoleGuard)
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  @DojoRoles(DojoRole.STUDENT, DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  listVisible(@Param('dojoId') dojoId: string, @Req() req) {
    return this.contentsService.getByDojo(dojoId, req.user.sub);
  }

  @Post()
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  create(@Param('dojoId') dojoId: string, @Body() dto: CreateContentDto, @Req() req) {
    return this.contentsService.create(dojoId, req.user.sub, dto);
  }

  @Post(':contentId/complete')
  @DojoRoles(DojoRole.STUDENT)
  complete(@Param('contentId') contentId: string, @Req() req) {
    return this.contentsService.completeContent(contentId, req.user.sub);
  }

  @Post('grades/:gradeId')
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  createForGrade(
    @Param('dojoId') dojoId: string,
    @Param('gradeId') gradeId: string,
    @Body() dto: CreateContentDto,
    @Req() req,
  ) {
    return this.contentsService.createForGrade(dojoId, gradeId, req.user.sub, dto);
  }

  @Get('grades/:gradeId')
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  listByGrade(@Param('dojoId') dojoId: string, @Param('gradeId') gradeId: string) {
    return this.contentsService.getByGrade(dojoId, gradeId);
  }
}

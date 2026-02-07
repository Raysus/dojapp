import { Controller, Post, Param, Body, Req, UseGuards, Get } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DojoRoleGuard } from '../authorization/guards/dojo-role.guard';
import { DojoRoles } from '../authorization/decorators/dojo-roles.decorator';
import { DojoRole } from '@prisma/client';
import { CreateContentDto } from './dto/create-content.dto';

@Controller('dojos/:dojoId/contents')
@UseGuards(JwtAuthGuard)
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) { }

  @Get()
  findForStudent(
    @Param('dojoId') dojoId: string,
    @Req() req,
  ) {
    return this.contentsService.findVisibleForStudent(
      dojoId,
      req.user.sub,
    );
  }

  @Post()
  @DojoRoles(DojoRole.INSTRUCTOR, DojoRole.PROFESSOR)
  create(
    @Param('dojoId') dojoId: string,
    @Body() dto: CreateContentDto,
    @Req() req,
  ) {
    return this.contentsService.create(
      dojoId,
      req.user.sub,
      dto,
    );
  }

  @Get()
  @DojoRoles(
    DojoRole.STUDENT,
    DojoRole.PROFESSOR,
    DojoRole.INSTRUCTOR,
  )
  findVisible(
    @Param('dojoId') dojoId: string,
    @Req() req,
  ) {
    return this.contentsService.findVisibleForStudent(
      dojoId,
      req.user.sub,
    );
  }

  @Post(':contentId/complete')
  complete(
    @Param('contentId') contentId: string,
    @Req() req,
  ) {
    return this.contentsService.completeContent(
      contentId,
      req.user.sub,
    );
  }

  @Get()
  list(
    @Param('dojoId') dojoId: string,
    @Req() req,
  ) {
    return this.contentsService.listForStudent(
      dojoId,
      req.user.sub,
    );
  }

  @Get('me')
  getMyUnlocked(
    @Param('dojoId') dojoId: string,
    @Req() req,
  ) {
    return this.contentsService.getUnlockedForStudent(
      dojoId,
      req.user.sub,
    );
  }

  @UseGuards(JwtAuthGuard, DojoRoleGuard)
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  @Post('dojos/:dojoId/grades/:gradeId/contents')
  createForGrade(
    @Param('dojoId') dojoId: string,
    @Param('gradeId') gradeId: string,
    @Body() dto: CreateContentDto,
    @Req() req,
  ) {
    return this.contentsService.createForGrade(
      dojoId,
      gradeId,
      req.user.sub,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, DojoRoleGuard)
  @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
  @Get('dojos/:dojoId/grades/:gradeId/contents')
  getByGrade(
    @Param('dojoId') dojoId: string,
    @Param('gradeId') gradeId: string,
  ) {
    return this.contentsService.getByGrade(dojoId, gradeId);
  }
}

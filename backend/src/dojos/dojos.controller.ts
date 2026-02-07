import { Controller, Get, Req, UseGuards, Param, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../authorization/guards/roles.guard';
import { Roles } from '../authorization/decorators/roles.decorator';
import { DojosService } from './dojos.service';
import { DojoRoleGuard } from 'src/authorization/guards/dojo-role.guard';
import { DojoRole } from '@prisma/client';
import { DojoRoles } from 'src/authorization/decorators/dojo-roles.decorator';
import { CreateContentDto } from 'src/contents/dto/create-content.dto';

@Controller('dojos')
@UseGuards(JwtAuthGuard)
export class DojosController {
    contentsService: any;
    constructor(private readonly dojosService: DojosService) { }

    @Get('mine')
    @Roles('PROFESSOR')
    getMine(@Req() req) {
        console.log('USER:', req.user);
        return this.dojosService.getByProfessor(req.user.sub);
    }

    @Get(':dojoId/students')
    @UseGuards(JwtAuthGuard, DojoRoleGuard)
    @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
    getStudents(
        @Param('dojoId') dojoId: string,
        @Req() req
    ) {
        return this.dojosService.getStudentsWithGrade(
            dojoId,
            req.user.sub
        );
    }

    @UseGuards(JwtAuthGuard, DojoRoleGuard)
    @DojoRoles(DojoRole.INSTRUCTOR, DojoRole.PROFESSOR)
    @Post(':dojoId/contents')
    createContent(
        @Param('dojoId') dojoId: string,
        @Body() dto: CreateContentDto,
        @Req() req,
    ) {
        return this.contentsService.create(
            dojoId,
            dto,
            req.user.sub, // userId YA validado
        );
    }

    @UseGuards(JwtAuthGuard, DojoRoleGuard)
    @Get(':dojoId/contents')
    getAvailableContents(
        @Param('dojoId') dojoId: string,
        @Req() req
    ) {
        return this.dojosService.getContentsForStudent(
            dojoId,
            req.user.sub
        );
    }

    @UseGuards(JwtAuthGuard, DojoRoleGuard)
    @DojoRoles(DojoRole.INSTRUCTOR, DojoRole.PROFESSOR)
    @Post(':dojoId/attendance')
    takeAttendance() { }

    @UseGuards(JwtAuthGuard, DojoRoleGuard)
    @DojoRoles(
        DojoRole.STUDENT,
        DojoRole.INSTRUCTOR,
        DojoRole.PROFESSOR
    )
    @Get(':dojoId/contents')
    getContents() { }


}

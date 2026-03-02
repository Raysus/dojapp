import { Controller, Get, Req, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../authorization/decorators/roles.decorator';
import { DojosService } from './dojos.service';
import { DojoRoleGuard } from 'src/authorization/guards/dojo-role.guard';
import { DojoRole, UserRole } from '@prisma/client';
import { DojoRoles } from 'src/authorization/decorators/dojo-roles.decorator';

@Controller('dojos')
@UseGuards(JwtAuthGuard)
export class DojosController {
    constructor(private readonly dojosService: DojosService) { }

    @Get('mine')
    @Roles(UserRole.PROFESSOR)
    getMine(@Req() req) {
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

    @Get(':dojoId/grades')
    @UseGuards(JwtAuthGuard, DojoRoleGuard)
    @DojoRoles(DojoRole.PROFESSOR, DojoRole.INSTRUCTOR)
    getGrades(
        @Param('dojoId') dojoId: string,
        @Req() req,
    ) {
        return this.dojosService.getGradesForDojo(dojoId, req.user.sub);
    }
}

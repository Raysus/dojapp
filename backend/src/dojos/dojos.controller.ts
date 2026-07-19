import { Controller, Get, Req, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DojosService } from './dojos.service';
import { DojoRoleGuard } from 'src/authorization/guards/dojo-role.guard';
import { DojoRole } from '@prisma/client';
import { DojoRoles } from 'src/authorization/decorators/dojo-roles.decorator';

@Controller('dojos')
@UseGuards(JwtAuthGuard)
export class DojosController {
    constructor(private readonly dojosService: DojosService) { }

    /** Any authenticated user — filtered to professor/instructor memberships. */
    @Get('mine')
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

    /**
     * List grades available for this dojo's style.
     * Used by professor/instructor to assign a student's grade.
     */
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

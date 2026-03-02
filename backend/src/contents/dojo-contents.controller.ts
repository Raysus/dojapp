import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { DojoRoleGuard } from '../authorization/guards/dojo-role.guard'
import { DojoRoles } from '../authorization/decorators/dojo-roles.decorator'
import { DojoRole, UserRole } from '@prisma/client'
import { DojoContentsService } from './dojo-contents.service'

@Controller('dojos/:dojoId/contents')
@UseGuards(JwtAuthGuard)
export class DojoContentsController {
    constructor(private readonly service: DojoContentsService) { }

    @Get(':contentId')
    @UseGuards(DojoRoleGuard)
    @DojoRoles(DojoRole.STUDENT, DojoRole.INSTRUCTOR, DojoRole.PROFESSOR)
    async getOne(
        @Param('dojoId') dojoId: string,
        @Param('contentId') contentId: string,
        @Req() req: any,
    ) {
        const userId = req.user?.sub ?? req.user?.id
        const role: UserRole = req.user?.role
        return this.service.getContentForDojo(dojoId, contentId, userId, role)
    }
}
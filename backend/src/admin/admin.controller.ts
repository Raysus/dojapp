import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Roles } from '../authorization/decorators/roles.decorator'
import { RolesGuard } from '../authorization/guards/roles.guard'
import { AdminService } from './admin.service'

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('health')
  health() {
    return this.adminService.health()
  }

  @Get('stats')
  async stats() {
    return this.adminService.stats()
  }

  @Get('users')
  async listUsers() {
    return this.adminService.listUsers()
  }

  @Post('users')
  async createUser(
    @Body()
    body: {
      email: string
      password: string
      name: string
      role: UserRole
      dojoId?: string
      dojoRole?: 'STUDENT' | 'INSTRUCTOR' | 'PROFESSOR'
      gradeId?: string
    },
  ) {
    return this.adminService.createUser(body)
  }

  @Post('users/:userId/assign')
  async assignUserToDojo(
    @Param('userId') userId: string,
    @Body()
    body: {
      dojoId: string
      dojoRole: 'STUDENT' | 'INSTRUCTOR' | 'PROFESSOR'
      gradeId?: string
    },
  ) {
    return this.adminService.assignUserToDojo(userId, body)
  }

  @Get('dojos')
  async listDojos() {
    return this.adminService.listDojos()
  }

  @Get('dojos/:dojoId/grades')
  async listGrades(@Param('dojoId') dojoId: string) {
    return this.adminService.listGrades(dojoId)
  }

  @Post('dojos/:dojoId/contents')
  async createContent(
    @Param('dojoId') dojoId: string,
    @Body()
    body: {
      title: string
      type: 'PDF' | 'VIDEO' | 'TEXT' | 'LINK'
      url?: string
      body?: string
      gradeId?: string
    },
    @Req() req,
  ) {
    return this.adminService.createContent(dojoId, req.user.sub, body)
  }
}

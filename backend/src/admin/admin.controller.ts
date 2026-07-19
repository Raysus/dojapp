import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Roles } from '../authorization/decorators/roles.decorator'
import { RolesGuard } from '../authorization/guards/roles.guard'
import { AdminService } from './admin.service'
import {
  AssignUserToDojoDto,
  CreateAdminContentDto,
  CreateAdminUserDto,
} from './dto/admin.dto'

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
  async createUser(@Body() body: CreateAdminUserDto) {
    return this.adminService.createUser(body)
  }

  @Post('users/:userId/assign')
  async assignUserToDojo(
    @Param('userId') userId: string,
    @Body() body: AssignUserToDojoDto,
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
    @Body() body: CreateAdminContentDto,
    @Req() req,
  ) {
    return this.adminService.createContent(dojoId, req.user.sub, body)
  }
}

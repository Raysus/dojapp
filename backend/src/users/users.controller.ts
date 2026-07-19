import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req) {
    return this.usersService.getMe(req.user.sub);
  }

  @Patch('me')
  updateMe(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(req.user.sub, dto);
  }

  @Post('me/password')
  changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.sub, dto);
  }

  @Post('me/logout-others')
  logoutOtherSessions(@Req() req) {
    return this.usersService.logoutOtherSessions(req.user.sub);
  }
}

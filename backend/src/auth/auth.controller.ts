import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

class RefreshDto {
  @IsString()
  @MinLength(10)
  refresh_token: string;
}

class LogoutDto {
  @IsOptional()
  @IsString()
  refresh_token?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.refresh_token);
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  logout(@Body() body: LogoutDto, @Req() req: { user?: { sub?: string } }) {
    return this.authService.logout(body?.refresh_token, req.user?.sub);
  }
}

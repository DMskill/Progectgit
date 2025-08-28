import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
  Patch,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) { }

  // Регистрация: 5 запросов в минуту на IP
  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async register(@Body() body: RegisterDto) {
    const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    return this.auth.register(body, baseUrl);
  }

  // Подтверждение почты: 20 запросов в минуту (безопасно)
  @Get('verify')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async verify(@Query('token') token: string, @Res() res: Response) {
    await this.auth.verify(token);
    const appUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    return res.redirect(`${appUrl.replace(/\/$/, '')}/auth/verified?success=1`);
  }

  // Логин: 10 запросов в минуту на IP
  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return this.auth.me(req.user.userId);
  }

  // Профиль: 30 запросов в минуту (обычные UI-изменения)
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async updateProfile(@Req() req: any, @Body() body: UpdateProfileDto) {
    return this.auth.updateProfile(req.user.userId, body);
  }

  // Смена пароля: 3 запроса в минуту
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async changePassword(
    @Req() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.auth.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  // Запрос смены email: 3 запроса в минуту
  @Post('request-email-change')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async requestEmailChange(
    @Req() req: any,
    @Body() body: { newEmail: string },
  ) {
    const publicApi =
      process.env.PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3001';
    return this.auth.requestEmailChange(
      req.user.userId,
      body.newEmail,
      publicApi,
    );
  }

  // Подтверждение смены email: 20 запросов в минуту
  @Get('confirm-email-change')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async confirmEmailChange(@Query('token') token: string) {
    return this.auth.confirmEmailChange(token);
  }
}

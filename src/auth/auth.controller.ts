import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AllowTempPassword } from './decorators/allow-temp-password.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const CREDENTIAL_IP_CEILING = { default: { limit: 60, ttl: 60_000 } };

const SEND_MAIL_RATE_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle(CREDENTIAL_IP_CEILING)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, refreshToken);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Không tìm thấy phiên đăng nhập');
    }
    const { refreshToken, ...result } =
      await this.authService.refreshTokens(token);
    this.setRefreshTokenCookie(res, refreshToken);
    return result;
  }

  // ── Self-service password reset (FR_STU_01) ──────────────

  @Public()
  @Throttle(SEND_MAIL_RATE_LIMIT)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Get('reset-password/:token')
  checkResetToken(@Param('token') token: string) {
    return this.authService.checkResetToken(token);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ── Session ──────────────────────────────────────────────

  @AllowTempPassword()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @GetUser('id') userId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('refreshToken', { path: '/auth' });
    return this.authService.logout(userId);
  }

  @AllowTempPassword()
  @Get('me')
  getMe(@GetUser('id') userId: number) {
    return this.authService.getMe(userId);
  }

  @AllowTempPassword()
  @Throttle(CREDENTIAL_IP_CEILING)
  @Patch('change-password')
  async changePassword(
    @GetUser('id') userId: number,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.authService.changePassword(
      userId,
      dto,
    );
    this.setRefreshTokenCookie(res, refreshToken);
    return result;
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days matches JWT_REFRESH_EXPIRES_IN default
    });
  }
}

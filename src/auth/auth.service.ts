import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const RESET_TOKEN_TTL_MINUTES = 15;

const FREE_PASSWORD_ATTEMPTS = 3;

const PASSWORD_BACKOFF_START_MS = 1_000;

const PASSWORD_BACKOFF_MAX_MS = 30_000;

const ABSENT_ACCOUNT_PASSWORD_HASH =
  '$2b$10$Lh36v./BP/ZgRspszc4NE.SipqI9aACi2TdYJTxd11Xri.fQc/4h2';

function passwordRetryAfterMs(
  user: { passwordRetryAfter: Date | null } | null,
) {
  if (!user?.passwordRetryAfter) return 0;
  return Math.max(0, user.passwordRetryAfter.getTime() - Date.now());
}

function retryAfterSeconds(ms: number) {
  return Math.ceil(ms / 1000);
}

function passwordBackoffMs(failures: number) {
  const overrun = failures - FREE_PASSWORD_ATTEMPTS;
  if (overrun <= 0) return 0;

  return Math.min(
    PASSWORD_BACKOFF_START_MS * 2 ** (overrun - 1),
    PASSWORD_BACKOFF_MAX_MS,
  );
}

const FORGOT_PASSWORD_REPLY = {
  message:
    'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.',
};

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.refreshExpiresIn = config.get('JWT_REFRESH_EXPIRES_IN', '30d');
    this.frontendUrl = config.get('FRONTEND_URL', 'http://localhost:3000');
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      // The name comes back with the account because the client greets somebody
      // the moment they arrive, and one round trip to /auth/me for a string it
      // could have had here is a header that renders an address for a second and
      // then swaps it for a name.
      include: {
        studentProfile: { select: { fullName: true } },
        lecturerProfile: { select: { fullName: true } },
      },
    });

    const retryAfterMs = passwordRetryAfterMs(user);
    if (retryAfterMs > 0) {
      throw new HttpException(
        `Sai mật khẩu nhiều lần. Thử lại sau ${retryAfterSeconds(retryAfterMs)} giây.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // One comparison, on both paths.
    //
    // A deactivated account takes the sentinel too: it can never be signed in
    // to, so there is nothing to compare against, and skipping the work here
    // would time-leak the difference between an account that is disabled and an
    // address that was never issued.
    const account = user?.isActive ? user : null;
    const passwordMatch = await bcrypt.compare(
      dto.password,
      account?.password ?? ABSENT_ACCOUNT_PASSWORD_HASH,
    );

    if (!account || !passwordMatch) {
      // Only a real row can carry a counter. An address nobody holds is limited
      // by the per-IP ceiling on the route and nothing else, which is correct —
      // there is no account here to protect.
      if (user) await this.recordFailedPassword(user);
      // One wording for both, and it names neither field as the wrong one.
      // "Email không tồn tại" would answer the question the sentinel hash above
      // is there to keep unanswered.
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    await this.clearFailedPasswords(account);

    const tokens = await this.generateTokenPair(
      account.id,
      account.email,
      account.role,
    );

    return {
      ...tokens,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
        mustChangePassword: account.mustChangePassword,
        fullName:
          account.studentProfile?.fullName ??
          account.lecturerProfile?.fullName ??
          null,
        avatarUrl: account.avatarUrl,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    // Verify the refresh token JWT
    let payload: { sub: number; email: string; role: string };
    try {
      payload = await this.jwt.verifyAsync<{
        sub: number;
        email: string;
        role: string;
      }>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }

    // Check the token hash exists in DB
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // If token was found but expired, clean it up
      if (storedToken) {
        await this.prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
      }
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }

    // Delete the old token (rotation)
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Generate new token pair
    const tokens = await this.generateTokenPair(
      payload.sub,
      payload.email,
      payload.role,
    );

    return tokens;
  }

  async logout(userId: number) {
    // Delete all refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Đã đăng xuất' };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        // Login returns this too, but a client that reloads has only /auth/me
        // to rebuild its session from — without it here, refreshing the page
        // silently escapes the forced password-change screen.
        mustChangePassword: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: { select: { fullName: true, studentCode: true } },
        lecturerProfile: { select: { fullName: true, lecturerCode: true } },
      },
    });

    if (!user || !user.isActive)
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc đã bị vô hiệu hoá',
      );

    return user;
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');

    if (!user.mustChangePassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại');
      }

      const retryAfterMs = passwordRetryAfterMs(user);
      if (retryAfterMs > 0) {
        throw new HttpException(
          `Sai mật khẩu nhiều lần. Thử lại sau ${retryAfterSeconds(retryAfterMs)} giây.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const passwordMatch = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );
      if (!passwordMatch) {
        await this.recordFailedPassword(user);
        throw new BadRequestException('Mật khẩu hiện tại không đúng');
      }

      await this.clearFailedPasswords(user);
    }

    const hash = await bcrypt.hash(dto.newPassword, 10);

    // Update password and clear the force-change flag in one query
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hash, mustChangePassword: false },
    });

    // Revoke all existing refresh tokens so old sessions are invalidated
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    // Issue a fresh token pair — user stays logged in seamlessly
    const tokens = await this.generateTokenPair(userId, user.email, user.role);

    return {
      message: 'Đổi mật khẩu thành công',
      ...tokens,
    };
  }

  // ── Self-service password reset (FR_STU_01) ──────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        isActive: true,
        studentProfile: { select: { fullName: true } },
        lecturerProfile: { select: { fullName: true } },
      },
    });

    // A deactivated account is not a route back in, but saying so would leak.
    if (!user || !user.isActive) return FORGOT_PASSWORD_REPLY;

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000,
    );

    // Supersede any link already outstanding: requesting five resets should
    // leave one way in, not five.
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: this.hashToken(token), expiresAt },
      }),
    ]);

    await this.recordAudit(user.id, 'REQUEST_PASSWORD_RESET', user.id);

    const fullName =
      user.studentProfile?.fullName ?? user.lecturerProfile?.fullName;

    void this.mail.sendPasswordResetLink({
      to: user.email,
      fullName,
      resetUrl: `${this.frontendUrl}/reset-password?token=${token}`,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
    });

    return FORGOT_PASSWORD_REPLY;
  }

  async checkResetToken(token: string) {
    const record = await this.findLiveResetToken(token);
    return { valid: record !== null };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.findLiveResetToken(dto.token);
    if (!record) {
      throw new BadRequestException(
        'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        // Not mustChangePassword: the user has just chosen this password
        // themselves, so demanding another change would be noise.
        data: { password: passwordHash, mustChangePassword: false },
      }),
      // Spend the link, and drop any sibling.
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: record.userId },
      }),
      // People reset because they suspect someone else is inside the account.
      // Leaving existing sessions alive would defeat the entire exercise.
      this.prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    await this.recordAudit(record.userId, 'RESET_PASSWORD', record.userId);

    const fullName =
      record.user.studentProfile?.fullName ??
      record.user.lecturerProfile?.fullName;

    void this.mail.sendPasswordChangedNotice({
      to: record.user.email,
      fullName,
      changedAt: new Date(),
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  // ── Private helpers ──────────────────────────────────────

  private async recordFailedPassword(user: { id: number }) {
    const { failedPasswordCount } = await this.prisma.user.update({
      where: { id: user.id },
      data: { failedPasswordCount: { increment: 1 } },
      select: { failedPasswordCount: true },
    });

    const delayMs = passwordBackoffMs(failedPasswordCount);
    if (delayMs === 0) return;

    // A second statement, because the delay depends on the count the increment
    // just produced. Concurrent failures each write their own instant and the
    // last one wins, which is the right outcome: the delay grows with the count,
    // so the straggler is writing the longest of them.
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordRetryAfter: new Date(Date.now() + delayMs) },
    });
  }

  private async clearFailedPasswords(user: {
    id: number;
    failedPasswordCount: number;
    passwordRetryAfter: Date | null;
  }) {
    if (user.failedPasswordCount === 0 && user.passwordRetryAfter === null)
      return;

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedPasswordCount: 0, passwordRetryAfter: null },
    });
  }

  private async findLiveResetToken(token: string) {
    if (!token) return null;

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            studentProfile: { select: { fullName: true } },
            lecturerProfile: { select: { fullName: true } },
          },
        },
      },
    });

    if (!record || record.expiresAt < new Date() || !record.user.isActive) {
      return null;
    }
    return record;
  }

  private async recordAudit(userId: number, action: string, targetId: number) {
    await this.prisma.auditLog
      .create({
        data: {
          userId,
          action,
          targetTable: 'users',
          targetId: String(targetId),
        },
      })
      .catch(() => undefined);
  }

  private async generateTokenPair(userId: number, email: string, role: string) {
    const jwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(jwtPayload),
      // `jti` is what keeps two refresh tokens for the same user distinct.
      // Everything else in the payload is fixed, and `iat` only has one-second
      // resolution, so two issues inside the same second produced a
      // byte-identical JWT — and therefore an identical tokenHash, which the
      // unique index rejected with a 500. Changing a password issues a pair
      // and the client immediately uses it, so that second is easy to hit.
      this.jwt.signAsync(
        { ...jwtPayload, jti: randomUUID() },
        {
          secret: this.refreshSecret,
          expiresIn: this.refreshExpiresIn as `${number}d`,
        },
      ),
    ]);

    // Store refresh token hash in DB
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = this.parseExpiresIn(this.refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiresIn(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) throw new Error(`Invalid expiresIn format: ${expiresIn}`);

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const ms: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * ms[unit]);
  }
}

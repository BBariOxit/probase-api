import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';

export type MailableRole = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface CredentialsEmailPayload {
  to: string;
  fullName?: string; // Absent only for ADMIN accounts, which have no profile
  tempPassword: string;
  role: MailableRole;
}

const ROLE_LABELS: Record<MailableRole, string> = {
  ADMIN: 'Quản trị viên',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client: BrevoClient;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.client = new BrevoClient({
      apiKey: this.config.getOrThrow<string>('BREVO_API_KEY'),
    });
    this.senderEmail = this.config.getOrThrow<string>('BREVO_SENDER_EMAIL');
    this.senderName = this.config.get<string>('BREVO_SENDER_NAME', 'ProBase');
    this.frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
  }

  async sendAccountCreated(payload: CredentialsEmailPayload): Promise<boolean> {
    return this.sendCredentialsEmail({
      payload,
      subject: '[ProBase] Tài khoản của bạn đã được tạo',
      introText: `Tài khoản <strong>${ROLE_LABELS[payload.role]}</strong> của bạn trên hệ thống ProBase đã được tạo.`,
      logLabel: 'Account-created',
    });
  }

  async sendPasswordReset(payload: CredentialsEmailPayload): Promise<boolean> {
    return this.sendCredentialsEmail({
      payload,
      subject: '[ProBase] Mật khẩu của bạn đã được đặt lại',
      introText:
        'Mật khẩu tài khoản của bạn trên hệ thống ProBase vừa được quản trị viên đặt lại.',
      logLabel: 'Password-reset',
    });
  }

  async sendPasswordResetLink(payload: {
    to: string;
    fullName?: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): Promise<boolean> {
    return this.send({
      to: payload.to,
      fullName: payload.fullName,
      subject: '[ProBase] Đặt lại mật khẩu',
      logLabel: 'Password-reset-link',
      html: this.renderShell({
        fullName: payload.fullName,
        introText:
          'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.',
        bodyHtml: `
            <table width="100%" style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;margin:20px 0 28px;">
              <tr><td style="padding:14px 18px;font-size:13px;color:#78610a;">
                Liên kết chỉ dùng được <strong>một lần</strong> và hết hạn sau <strong>${payload.expiresInMinutes} phút</strong>.
                Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu hiện tại vẫn giữ nguyên.
              </td></tr>
            </table>
            ${this.renderButton(payload.resetUrl, 'Đặt lại mật khẩu')}`,
      }),
    });
  }

  async sendPasswordChangedNotice(payload: {
    to: string;
    fullName?: string;
    changedAt: Date;
  }): Promise<boolean> {
    const when = payload.changedAt.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    return this.send({
      to: payload.to,
      fullName: payload.fullName,
      subject: '[ProBase] Mật khẩu của bạn vừa được thay đổi',
      logLabel: 'Password-changed-notice',
      html: this.renderShell({
        fullName: payload.fullName,
        introText: `Mật khẩu tài khoản ProBase của bạn vừa được thay đổi lúc <strong>${escapeHtml(when)}</strong>.`,
        bodyHtml: `
            <table width="100%" style="background:#fdecea;border-left:4px solid #c0392b;border-radius:4px;margin:20px 0 28px;">
              <tr><td style="padding:14px 18px;font-size:13px;color:#7b241c;">
                Nếu <strong>không phải bạn</strong> thực hiện, hãy liên hệ giáo vụ khoa ngay để được khoá tài khoản.
              </td></tr>
            </table>
            ${this.renderButton(`${this.frontendUrl}/login`, 'Đăng nhập')}`,
      }),
    });
  }

  private async send(args: {
    to: string;
    fullName?: string;
    subject: string;
    logLabel: string;
    html: string;
  }): Promise<boolean> {
    try {
      await this.client.transactionalEmails.sendTransacEmail({
        sender: { email: this.senderEmail, name: this.senderName },
        to: [{ email: args.to, name: args.fullName ?? args.to }],
        subject: args.subject,
        htmlContent: args.html,
      });
      this.logger.log(`${args.logLabel} email sent to ${args.to}`);
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to send ${args.logLabel.toLowerCase()} email to ${args.to}`,
        err,
      );
      return false;
    }
  }

  private async sendCredentialsEmail(args: {
    payload: CredentialsEmailPayload;
    subject: string;
    introText: string;
    logLabel: string;
  }): Promise<boolean> {
    const { payload, subject, introText, logLabel } = args;
    const { to, fullName, tempPassword } = payload;

    // Delivery never throws; the boolean is what lets a caller report a failure
    // instead of assuming the credentials arrived.
    return this.send({
      to,
      fullName,
      subject,
      logLabel,
      html: this.buildTemplate({
        fullName,
        email: to,
        tempPassword,
        introText,
      }),
    });
  }

  private buildTemplate(data: {
    fullName?: string;
    email: string;
    tempPassword: string;

    introText: string;
  }): string {
    return this.renderShell({
      fullName: data.fullName,
      introText: data.introText,
      bodyHtml: `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td style="background:#121212;border:1px solid #262626;border-radius:6px;padding:24px;">
                  <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#737373;font-weight:600;">Email đăng nhập</p>
                  <p style="margin:0 0 24px;font-size:16px;color:#ffffff;font-weight:500;">${escapeHtml(data.email)}</p>
                  
                  <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#737373;font-weight:600;">Mật khẩu tạm thời</p>
                  <p style="margin:0;font-size:24px;color:#ffffff;font-family:monospace;letter-spacing:2px;">${escapeHtml(data.tempPassword)}</p>
                </td>
              </tr>
            </table>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="border-left:3px solid #f59e0b;padding:12px 16px;background:#1a1505;">
                  <p style="margin:0;font-size:13px;color:#d4d4d4;line-height:1.6;">
                    <strong style="color:#f59e0b;">Lưu ý bảo mật:</strong> Bạn sẽ được yêu cầu đổi mật khẩu ngay sau khi đăng nhập lần đầu tiên.
                  </p>
                </td>
              </tr>
            </table>
            ${this.renderButton(`${this.frontendUrl}/login`, 'Đăng nhập vào hệ thống')}`,
    });
  }

  private renderButton(href: string, label: string): string {
    return `<table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left">
                  <a href="${href}" style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:0.5px;">
                    ${label}
                  </a>
                </td>
              </tr>
            </table>`;
  }

  private renderShell(data: {
    fullName?: string;
    introText: string;
    bodyHtml: string;
  }): string {
    // Only ADMIN accounts have no profile name
    const greeting = data.fullName
      ? `Xin chào <strong style="color:#ffffff;">${escapeHtml(data.fullName)}</strong>,`
      : 'Xin chào,';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="color-scheme" content="dark">
  <title>ProBase</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#e5e5e5;line-height:1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#0a0a0a;border:1px solid #262626;border-radius:12px;overflow:hidden;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:40px;border-bottom:1px solid #1f1f1f;">
            <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:700;letter-spacing:-0.5px;">PROBASE</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px;font-size:16px;">${greeting}</p>
            <p style="margin:0 0 32px;font-size:15px;color:#a3a3a3;">${data.introText}</p>
            ${data.bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;border-top:1px solid #1f1f1f;background:#050505;">
            <p style="margin:0;font-size:12px;color:#525252;line-height:1.5;">
              Email tự động từ hệ thống ProBase.<br>Vui lòng không trả lời email này.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}

import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: any = null;
  private fromAddress: string = process.env.MAIL_FROM || 'no-reply@example.com';

  private ensureTransporter() {
    if (this.transporter) return;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } =
      process.env as Record<string, string | undefined>;
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      const portNum = Number(SMTP_PORT);
      const secure = SMTP_SECURE === 'true' || (!SMTP_SECURE && portNum === 465);
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: portNum,
        secure, // true для 465, иначе STARTTLS на 587
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
    } else {
      this.transporter = null;
    }
  }

  async sendVerificationEmail(to: string, link: string) {
    this.ensureTransporter();
    const subject = 'Confirm your email for ProP2P';
    const text =
      `You created an account on ProP2P.\n` +
      `To confirm your email, open this link: ${link}\n` +
      `If you did not request this, just ignore this message.`;
    const html = `
      <p>You created an account on <strong>ProP2P</strong>.</p>
      <p>To confirm your email, please click the button below:</p>
      <p><a href="${link}" style="
        display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;
        text-decoration:none;border-radius:6px;">Confirm email</a></p>
      <p>If you did not request this action, you can safely ignore this message.</p>
    `;

    if (!this.transporter) {
      console.log(`[DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}`);
      return { devLogged: true };
    }

    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      text,
      html,
      headers: {
        'Auto-Submitted': 'auto-generated',
      },
    });
    return { sent: true };
  }
}

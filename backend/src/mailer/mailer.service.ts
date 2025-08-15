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
    const subject = 'Verify your email';
    const text = `Please verify your email by clicking the link: ${link}`;
    const html = `<p>Please verify your email by clicking the link:</p><p><a href="${link}">${link}</a></p>`;

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
    });
    return { sent: true };
  }
}

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { MailerService } from '../mailer/mailer.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mailer: MailerService,
  ) {}

  async register(data: RegisterDto, _baseUrl: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        verified: false,
      },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48h
    await this.prisma.verificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const publicApi =
      process.env.PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3001';
    const verifyUrl = `${publicApi.replace(/\/$/, '')}/auth/verify?token=${token}`;
    await this.mailer.sendVerificationEmail(user.email, verifyUrl);

    const devMode = (process.env.NODE_ENV || 'development') !== 'production';
    if (devMode) {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: { verified: true },
        }),
        this.prisma.verificationToken.update({
          where: { token },
          data: { usedAt: new Date() },
        }),
      ]);
      return {
        ok: true,
        message:
          'Registration successful (dev mode). Account verified automatically.',
        devVerifyUrl: verifyUrl,
      };
    }

    const hasSmtp = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
    if (!hasSmtp) {
      return {
        ok: true,
        message:
          'Registration successful. Verify your email using the link below (dev mode).',
        devVerifyUrl: verifyUrl,
      };
    }

    return {
      ok: true,
      message: 'Registration successful. Check your email to verify account.',
    };
  }

  async verify(token: string) {
    const rec = await this.prisma.verificationToken.findUnique({
      where: { token },
    });
    if (!rec || rec.usedAt || rec.expiresAt < new Date())
      throw new BadRequestException('Invalid or expired token');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: rec.userId },
        data: { verified: true },
      }),
      this.prisma.verificationToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('Invalid credentials');
    const devMode = (process.env.NODE_ENV || 'development') !== 'production';
    if (!user.verified && !devMode)
      throw new UnauthorizedException('Email is not verified');
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        verified: true,
      },
    });
    return { user };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    if (data.nickname) {
      const exists = await this.prisma.user.findFirst({
        where: { nickname: data.nickname, NOT: { id: userId } },
        select: { id: true },
      });
      if (exists) throw new BadRequestException('Nickname already taken');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name ?? undefined,
        nickname: data.nickname ?? undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        verified: true,
      },
    });
    return { user: updated };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('No password set');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid current password');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { ok: true };
  }

  async requestEmailChange(
    userId: string,
    newEmail: string,
    publicApiBase: string,
  ) {
    const exists = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });
    if (exists) throw new BadRequestException('Email already registered');
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await this.prisma.emailChangeToken.create({
      data: { userId, newEmail, token, expiresAt },
    });
    const link = `${publicApiBase.replace(/\/$/, '')}/auth/confirm-email-change?token=${token}`;
    await this.mailer.sendVerificationEmail(newEmail, link);
    const hasSmtp = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
    if (!hasSmtp) return { ok: true, devVerifyUrl: link };
    return { ok: true };
  }

  async confirmEmailChange(token: string) {
    const rec = await this.prisma.emailChangeToken.findUnique({
      where: { token },
    });
    if (!rec || rec.usedAt || rec.expiresAt < new Date())
      throw new BadRequestException('Invalid or expired token');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: rec.userId },
        data: { email: rec.newEmail },
      }),
      this.prisma.emailChangeToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }
}

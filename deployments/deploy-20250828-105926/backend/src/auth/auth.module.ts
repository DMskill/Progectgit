import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailerService } from '../mailer/mailer.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'devsecret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [PrismaService, AuthService, MailerService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

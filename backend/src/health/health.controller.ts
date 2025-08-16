import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  async check() {
    return { ok: true, app: 'up' };
  }

  @Get('db')
  async checkDb() {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      return { ok: true, db: 'up' };
    } catch (e) {
      return { ok: false, db: 'down' };
    }
  }
}

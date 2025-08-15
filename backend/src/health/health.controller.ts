import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) { }

  @Get()
  async check() {
    // Ping DB
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, db: 'up', app: 'up' };
    } catch {
      return { ok: false, db: 'down', app: 'up' };
    }
  }
}

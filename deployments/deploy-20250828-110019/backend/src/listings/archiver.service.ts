import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_TTL_DAYS = Number(process.env.LISTING_TTL_DAYS || 30);
const ARCHIVE_RETENTION_DAYS = Number(
  process.env.LISTING_ARCHIVE_RETENTION_DAYS || 60,
);

@Injectable()
export class ArchiverService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ArchiverService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Запуск каждые 10 минут
    this.timer = setInterval(
      () => this.tick().catch((e) => this.logger.error(e)),
      10 * 60 * 1000,
    );
    // Первичный асинхронный прогон с задержкой, чтобы не тормозить старт
    setTimeout(() => this.tick().catch((e) => this.logger.error(e)), 15_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private nowUtc(): Date {
    return new Date();
  }
  private subDays(base: Date, days: number): Date {
    const d = new Date(base.getTime());
    d.setUTCDate(d.getUTCDate() - days);
    return d;
  }

  async tick() {
    const now = this.nowUtc();

    // Архивировать истёкшие ACTIVE
    const archived = await this.prisma.listing.updateMany({
      where: { status: 'ACTIVE' as any, expiresAt: { lte: now } },
      data: { status: 'ARCHIVED' as any, archivedAt: now },
    });

    // Удалить из архива старше retention (по archivedAt, если нет — по expiresAt)
    const cutoff = this.subDays(now, ARCHIVE_RETENTION_DAYS);
    const deletedByArchivedAt = await this.prisma.listing.deleteMany({
      where: { status: 'ARCHIVED' as any, archivedAt: { lte: cutoff } },
    });
    const deletedByExpiresAt = await this.prisma.listing.deleteMany({
      where: {
        status: 'ARCHIVED' as any,
        archivedAt: null,
        expiresAt: { lte: cutoff },
      },
    });

    if (
      archived.count ||
      deletedByArchivedAt.count ||
      deletedByExpiresAt.count
    ) {
      this.logger.log(
        `Archived: ${archived.count}, Deleted: ${deletedByArchivedAt.count + deletedByExpiresAt.count}`,
      );
    }
  }
}

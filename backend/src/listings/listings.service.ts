import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingsQueryDto } from './dto/listings-query.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

export type TradeAction = 'BUY' | 'SELL';
export type PaymentMethod = 'CASH' | 'CRYPTO' | 'BANK_TRANSFER' | 'GOODS';

const DEFAULT_TTL_DAYS = Number(process.env.LISTING_TTL_DAYS || 30);
const ACTIVE_LIMIT = Number(process.env.ACTIVE_LISTING_LIMIT || 10);

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) { }

  private nowUtc(): Date {
    return new Date();
  }
  private addDays(base: Date, days: number): Date {
    const d = new Date(base.getTime());
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  }

  private normalizePage(input: any, def = 1): number {
    const n = Number(input);
    if (!Number.isFinite(n) || n < 1) return def;
    return Math.floor(n);
  }
  private normalizeLimit(input: any, def = 50): number {
    const n = Number(input);
    const v = (!Number.isFinite(n) ? def : Math.floor(n));
    return Math.max(1, Math.min(100, v));
  }

  async findAll(
    query?: ListingsQueryDto,
    showContacts = false,
  ): Promise<any[]> {
    const where: any = {};
    const isArchived =
      query &&
      typeof query.archived === 'string' &&
      ['1', 'true', 'yes'].includes(query.archived.toLowerCase());
    if (isArchived) {
      // архив только при заданном seller, иначе пусто
      where.status = 'ARCHIVED';
      where.expiresAt = { lte: this.nowUtc() };
      if (!query?.seller) {
        return [];
      }
    } else {
      where.status = 'ACTIVE';
      where.expiresAt = { gt: this.nowUtc() };
    }
    if (query) {
      if (query.country) {
        where.OR = [
          { countryCode: { contains: query.country, mode: 'insensitive' } },
          { countryName: { contains: query.country, mode: 'insensitive' } },
        ];
      }
      if (query.city) {
        where.regionCity = { contains: query.city, mode: 'insensitive' };
      }
      if (query.crypto) {
        where.cryptoSymbol = { contains: query.crypto, mode: 'insensitive' };
      }
      if (query.action) {
        where.action = query.action;
      }
      if (query.seller) {
        where.seller = {
          OR: [
            { email: { contains: query.seller, mode: 'insensitive' } },
            { name: { contains: query.seller, mode: 'insensitive' } },
            { nickname: { contains: query.seller, mode: 'insensitive' } },
          ],
        };
      }
      if (query.method) {
        if (Array.isArray(query.method)) {
          where.receiveType = { in: query.method } as any;
        } else {
          where.receiveType = query.method;
        }
      }
    }
    const data = await this.prisma.listing.findMany({
      where: where,
      include: { seller: true },
      orderBy: { createdAt: 'desc' },
    });
    if (showContacts) {
      return data.map((i) => ({
        ...(i as any),
        contact: i.contact ?? i.description ?? null,
      }));
    }
    return data.map((i) => ({
      ...(i as any),
      contact: null,
      seller: { ...i.seller, email: '' },
    }));
  }

  async findAllPaged(
    query: any,
    showContacts = false,
  ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const where: any = {};
    const isArchived =
      query &&
      typeof query.archived === 'string' &&
      ['1', 'true', 'yes'].includes(String(query.archived).toLowerCase());
    if (isArchived) {
      where.status = 'ARCHIVED';
      where.expiresAt = { lte: this.nowUtc() };
      if (!query?.seller) {
        return {
          items: [],
          total: 0,
          page: 1,
          limit: this.normalizeLimit(query?.limit, 50),
        };
      }
    } else {
      where.status = 'ACTIVE';
      where.expiresAt = { gt: this.nowUtc() };
    }
    if (query) {
      if (query.country) {
        where.OR = [
          { countryCode: { contains: query.country, mode: 'insensitive' } },
          { countryName: { contains: query.country, mode: 'insensitive' } },
        ];
      }
      if (query.city)
        where.regionCity = { contains: query.city, mode: 'insensitive' };
      if (query.crypto)
        where.cryptoSymbol = { contains: query.crypto, mode: 'insensitive' };
      if (query.action) where.action = query.action;
      if (query.seller) {
        where.seller = {
          OR: [
            { email: { contains: query.seller, mode: 'insensitive' } },
            { name: { contains: query.seller, mode: 'insensitive' } },
            { nickname: { contains: query.seller, mode: 'insensitive' } },
          ],
        };
      }
      if (query.method) {
        if (Array.isArray(query.method))
          where.receiveType = { in: query.method } as any;
        else where.receiveType = query.method;
      }
    }

    const page = this.normalizePage(query?.page, 1);
    const limit = this.normalizeLimit(query?.limit, 50);
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.listing.count({ where: where }),
      this.prisma.listing.findMany({
        where: where,
        include: { seller: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    let items = data as any[];
    if (showContacts) {
      items = items.map((i) => ({
        ...i,
        contact: i.contact ?? i.description ?? null,
      }));
    } else {
      items = items.map((i) => ({
        ...i,
        contact: null,
        seller: { ...i.seller, email: '' },
      }));
    }
    return { items, total, page, limit };
  }

  async createForUser(userId: string, data: CreateListingDto) {
    if (!userId) throw new UnauthorizedException();

    const activeCount = await this.prisma.listing.count({
      where: {
        sellerId: userId,
        status: 'ACTIVE' as any,
        expiresAt: { gt: this.nowUtc() },
      } as any,
    });
    if (activeCount >= ACTIVE_LIMIT) {
      throw new ConflictException(
        `Достигнут лимит активных объявлений (${ACTIVE_LIMIT})`,
      );
    }

    const expiresAt = this.addDays(this.nowUtc(), DEFAULT_TTL_DAYS);

    // Добавляем имя продавца к контакту: "Имя - Контакт"
    const sellerUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const rawContact = (data as any).contact?.toString().trim();
    const contactCombined = sellerUser?.name
      ? `${sellerUser.name.trim()}${rawContact ? ' - ' + rawContact : ''}`
      : (rawContact ?? null);

    return this.prisma.listing.create({
      data: {
        countryCode: data.countryCode,
        countryName: data.countryName,
        regionCity: data.regionCity,
        action: data.action,
        cryptoSymbol: data.cryptoSymbol,
        amountTotal: data.amountTotal as any,
        minTrade: data.minTrade as any,
        receiveType: data.receiveType,
        receiveTypes: (data as any).receiveTypes ?? [],
        receiveAsset: data.receiveAsset,
        contact: contactCombined ?? undefined,
        description: data.description,
        expiresAt,
        status: 'ACTIVE' as any,
        seller: { connect: { id: userId } },
      } as any,
      include: { seller: true },
    });
  }

  async updateForUser(userId: string, id: string, data: UpdateListingDto) {
    if (!userId) throw new UnauthorizedException();
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId)
      throw new ForbiddenException('Not your listing');

    // При обновлении также формируем "Имя - Контакт"
    const sellerUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const rawContact = (data as any).contact?.toString().trim();
    const contactCombined =
      rawContact !== undefined
        ? sellerUser?.name
          ? `${sellerUser.name.trim()}${rawContact ? ' - ' + rawContact : ''}`
          : rawContact
        : undefined;
    return this.prisma.listing.update({
      where: { id },
      data: {
        countryCode: data.countryCode,
        countryName: data.countryName,
        regionCity: data.regionCity,
        action: data.action,
        cryptoSymbol: data.cryptoSymbol,
        amountTotal: data.amountTotal as any,
        minTrade: data.minTrade as any,
        receiveType: data.receiveType,
        receiveTypes: (data as any).receiveTypes ?? undefined,
        receiveAsset: data.receiveAsset,
        receiveAmount: (data.receiveAmount as any) ?? undefined,
        contact: contactCombined,
        description: data.description,
      } as any,
      include: { seller: true },
    });
  }

  async deleteForUser(userId: string, id: string) {
    if (!userId) throw new UnauthorizedException();
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId)
      throw new ForbiddenException('Not your listing');
    await this.prisma.listing.delete({ where: { id } });
    return { ok: true };
  }

  async repostForUser(userId: string, id: string) {
    if (!userId) throw new UnauthorizedException();

    const activeCount = await this.prisma.listing.count({
      where: {
        sellerId: userId,
        status: 'ACTIVE' as any,
        expiresAt: { gt: this.nowUtc() },
      } as any,
    });
    if (activeCount >= ACTIVE_LIMIT) {
      throw new ConflictException(
        `Достигнут лимит активных объявлений (${ACTIVE_LIMIT})`,
      );
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId)
      throw new ForbiddenException('Not your listing');

    const expiresAt = this.addDays(this.nowUtc(), DEFAULT_TTL_DAYS);

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'ACTIVE' as any, expiresAt, archivedAt: null } as any,
      include: { seller: true },
    });
  }

  async devArchiveForUser(userId: string, id: string) {
    if (!userId) throw new UnauthorizedException();
    if ((process.env.NODE_ENV || 'development') === 'production') {
      throw new ForbiddenException('Not allowed in production');
    }
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId)
      throw new ForbiddenException('Not your listing');
    const now = this.nowUtc();
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return this.prisma.listing.update({
      where: { id },
      data: {
        status: 'ARCHIVED' as any,
        archivedAt: now,
        expiresAt: past,
      } as any,
      include: { seller: true },
    });
  }
}

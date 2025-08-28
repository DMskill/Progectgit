import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { AdminUpdateListingDto } from './dto/update-listing.dto';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
    constructor(private prisma: PrismaService) { }

    @Get('ping')
    ping() {
        return { ok: true };
    }

    // Users
    @Get('users')
    async users(@Query('q') q?: string) {
        return this.prisma.user.findMany({
            where: q
                ? {
                    OR: [
                        { email: { contains: q, mode: 'insensitive' } },
                        { name: { contains: q, mode: 'insensitive' } },
                        { nickname: { contains: q, mode: 'insensitive' } },
                    ],
                }
                : undefined,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                nickname: true,
                verified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    @Patch('users/:id')
    async updateUser(@Param('id') id: string, @Body() body: AdminUpdateUserDto) {
        return this.prisma.user.update({
            where: { id },
            data: {
                name: body.name ?? undefined,
                nickname: body.nickname ?? undefined,
                verified: body.verified ?? undefined,
            },
        });
    }

    @Post('users/update')
    async updateUserPost(@Body() body: AdminUpdateUserDto & { id: string }) {
        return this.prisma.user.update({
            where: { id: body.id },
            data: {
                name: body.name ?? undefined,
                nickname: body.nickname ?? undefined,
                verified: body.verified ?? undefined,
            },
        });
    }

    @Patch('users/:id/ban')
    async banUser(@Param('id') id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { verified: false },
        });
    }

    @Patch('users/:id/unban')
    async unbanUser(@Param('id') id: string) {
        return this.prisma.user.update({ where: { id }, data: { verified: true } });
    }

    // Listings
    @Get('listings')
    async listings(@Query('q') q?: string) {
        return this.prisma.listing.findMany({
            where: q
                ? {
                    OR: [
                        { countryCode: { contains: q, mode: 'insensitive' } },
                        { countryName: { contains: q, mode: 'insensitive' } },
                        { regionCity: { contains: q, mode: 'insensitive' } },
                        { cryptoSymbol: { contains: q, mode: 'insensitive' } },
                        { description: { contains: q, mode: 'insensitive' } },
                    ],
                }
                : undefined,
            orderBy: { createdAt: 'desc' },
        });
    }

    @Patch('listings/:id')
    async updateListing(
        @Param('id') id: string,
        @Body() body: AdminUpdateListingDto,
    ) {
        return this.prisma.listing.update({
            where: { id },
            data: {
                countryCode: body.countryCode ?? undefined,
                countryName: body.countryName ?? undefined,
                regionCity: body.regionCity ?? undefined,
                action: body.action ?? undefined,
                cryptoSymbol: body.cryptoSymbol ?? undefined,
                amountTotal: body.amountTotal ? (body.amountTotal as any) : undefined,
                minTrade: body.minTrade ? (body.minTrade as any) : undefined,
                receiveType: body.receiveType ?? undefined,
                receiveAsset:
                    body.receiveAsset === undefined ? undefined : body.receiveAsset,
                receiveAmount: body.receiveAmount
                    ? (body.receiveAmount as any)
                    : undefined,
                description:
                    body.description === undefined ? undefined : body.description,
                contact: body.contact === undefined ? undefined : body.contact,
            },
        });
    }

    @Post('listings/update')
    async updateListingPost(@Body() body: AdminUpdateListingDto & { id: string }) {
        return this.prisma.listing.update({
            where: { id: body.id },
            data: {
                countryCode: body.countryCode ?? undefined,
                countryName: body.countryName ?? undefined,
                regionCity: body.regionCity ?? undefined,
                action: body.action ?? undefined,
                cryptoSymbol: body.cryptoSymbol ?? undefined,
                amountTotal: body.amountTotal ? (body.amountTotal as any) : undefined,
                minTrade: body.minTrade ? (body.minTrade as any) : undefined,
                receiveType: body.receiveType ?? undefined,
                receiveAsset:
                    body.receiveAsset === undefined ? undefined : body.receiveAsset,
                receiveAmount: body.receiveAmount
                    ? (body.receiveAmount as any)
                    : undefined,
                description:
                    body.description === undefined ? undefined : body.description,
                contact: body.contact === undefined ? undefined : body.contact,
            },
        });
    }

    @Delete('listings/:id')
    async deleteListing(@Param('id') id: string) {
        return this.prisma.listing.delete({ where: { id } });
    }

    @Patch('listings/:id/archive')
    async archiveListing(@Param('id') id: string) {
        return this.prisma.listing.update({
            where: { id },
            data: { status: 'ARCHIVED', archivedAt: new Date() },
        });
    }
}

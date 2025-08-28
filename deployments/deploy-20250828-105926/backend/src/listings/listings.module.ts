import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ArchiverService } from './archiver.service';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService, PrismaService, ArchiverService],
})
export class ListingsModule {}

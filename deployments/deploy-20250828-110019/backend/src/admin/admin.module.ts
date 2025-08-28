import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  controllers: [AdminController],
  providers: [PrismaService, AdminGuard],
})
export class AdminModule { }

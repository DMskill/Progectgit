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
  Req,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingsQueryDto } from './dto/listings-query.dto';
import {
  OptionalJwtAuthGuard,
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingsPagedQueryDto } from './dto/listings-paged-query.dto';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) { }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Req() req: any, @Query() query: ListingsQueryDto) {
    const showContacts = Boolean(req.user);
    return this.listingsService.findAll(query, showContacts);
  }

  @Get('paged')
  @UseGuards(OptionalJwtAuthGuard)
  findAllPaged(@Req() req: any, @Query() query: ListingsPagedQueryDto) {
    const showContacts = Boolean(req.user);
    return this.listingsService.findAllPaged(query, showContacts);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() body: CreateListingDto) {
    const userId = req.user?.userId as string;
    return this.listingsService.createForUser(userId, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateListingDto,
  ) {
    const userId = req.user?.userId as string;
    return this.listingsService.updateForUser(userId, id, body);
  }

  @Post(':id/repost')
  @UseGuards(JwtAuthGuard)
  repost(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId as string;
    return this.listingsService.repostForUser(userId, id);
  }

  @Post(':id/dev-archive')
  @UseGuards(JwtAuthGuard)
  devArchive(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId as string;
    return this.listingsService.devArchiveForUser(userId, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId as string;
    return this.listingsService.deleteForUser(userId, id);
  }
}

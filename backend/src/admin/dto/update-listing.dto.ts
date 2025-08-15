import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { PaymentMethod, TradeAction } from '@prisma/client';

export class AdminUpdateListingDto {
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  countryName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 160)
  regionCity?: string;

  @IsOptional()
  @IsEnum(TradeAction)
  action?: TradeAction;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  cryptoSymbol?: string;

  @IsOptional()
  @IsNumberString()
  amountTotal?: string;

  @IsOptional()
  @IsNumberString()
  minTrade?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  receiveType?: PaymentMethod;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  receiveAsset?: string | null;

  @IsOptional()
  @IsNumberString()
  receiveAmount?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  contact?: string | null;
}

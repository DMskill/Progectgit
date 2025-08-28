import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

const actions = ['BUY', 'SELL'] as const;
const methods = ['CASH', 'CRYPTO', 'BANK_TRANSFER', 'GOODS'] as const;

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsString()
  countryName?: string;

  @IsOptional()
  @IsString()
  regionCity?: string;

  @IsOptional()
  @IsIn(actions as unknown as string[])
  action?: (typeof actions)[number];

  @IsOptional()
  @IsString()
  cryptoSymbol?: string;

  @IsOptional()
  @Matches(/^\d{1,20}(\.\d{1,18})?$/)
  amountTotal?: string;

  @IsOptional()
  @Matches(/^\d{1,20}(\.\d{1,18})?$/)
  minTrade?: string;

  @IsOptional()
  @IsIn(methods as unknown as string[])
  receiveType?: (typeof methods)[number];

  @IsOptional()
  @IsIn(methods as unknown as string[], { each: true })
  receiveTypes?: (typeof methods)[number][];

  @IsOptional()
  @IsString()
  receiveAsset?: string;

  @IsOptional()
  @Matches(/^\d{1,20}(\.\d{1,18})?$/)
  receiveAmount?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

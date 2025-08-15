import { IsIn, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

const actions = ['BUY', 'SELL'] as const;
export type QueryAction = (typeof actions)[number];

const methods = ['CASH', 'CRYPTO', 'BANK_TRANSFER', 'GOODS'] as const;
export type QueryMethod = (typeof methods)[number];

export class ListingsPagedQueryDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  crypto?: string;

  @IsOptional()
  @IsIn(actions as unknown as string[])
  action?: QueryAction;

  @IsOptional()
  @IsString()
  seller?: string;

  @IsOptional()
  @IsIn(methods as unknown as string[], { each: true })
  method?: QueryMethod | QueryMethod[];

  @IsOptional()
  @IsString()
  archived?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

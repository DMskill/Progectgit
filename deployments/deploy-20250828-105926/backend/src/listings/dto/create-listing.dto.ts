import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  IsArray,
} from 'class-validator';

const tradeActions = ['BUY', 'SELL'] as const;
const paymentMethods = ['CASH', 'CRYPTO', 'BANK_TRANSFER', 'GOODS'] as const;

type TradeAction = (typeof tradeActions)[number];
type PaymentMethod = (typeof paymentMethods)[number];

export class CreateListingDto {
  @IsString()
  @Length(2, 2)
  countryCode!: string;

  @IsString()
  countryName!: string;

  @IsString()
  regionCity!: string;

  @IsIn(tradeActions as unknown as string[])
  action!: TradeAction;

  @IsString()
  cryptoSymbol!: string;

  @Matches(/^\d{1,20}(\.\d{1,18})?$/)
  amountTotal!: string;

  @Matches(/^\d{1,20}(\.\d{1,18})?$/)
  minTrade!: string;

  @IsIn(paymentMethods as unknown as string[])
  receiveType!: PaymentMethod;

  @IsOptional()
  @IsIn(paymentMethods as unknown as string[], { each: true })
  receiveTypes?: PaymentMethod[];

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

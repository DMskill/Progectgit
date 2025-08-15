import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(0, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 60)
  nickname?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

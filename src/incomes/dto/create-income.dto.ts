import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { IncomeSource, MoneyType } from '../income.entity';

export class CreateIncomeDto {
  @IsString()
  description!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  date!: string;

  @IsEnum(MoneyType)
  @IsOptional()
  moneyType?: MoneyType;

  @IsEnum(IncomeSource)
  @IsOptional()
  source?: IncomeSource;

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsString()
  @IsOptional()
  fromAccount?: string;
}

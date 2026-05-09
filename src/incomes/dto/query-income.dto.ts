import { IsDateString, IsOptional } from 'class-validator';

export class QueryIncomeDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}

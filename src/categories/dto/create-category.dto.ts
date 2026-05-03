import { IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsHexColor()
  @IsOptional()
  color?: string;
}

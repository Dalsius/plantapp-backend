import { IsString, IsNumber, IsBoolean, IsUrl } from 'class-validator';

export class CreatePlantDto {
  @IsString()
  name: string;

  @IsString()
  species: string;

  @IsUrl()
  imageUrl: string;

  @IsString()
  light: string;

  @IsNumber()
  waterEveryDays: number;

  @IsString()
  careNotes: string;

  @IsBoolean()
  toxic: boolean;
}

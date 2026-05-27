import { ContentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContentDto {
  @IsString()
  title: string;

  @IsEnum(ContentType)
  type: ContentType;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  body?: string;

  // The server sets this based on the Dojo's style.
  @IsOptional()
  @IsUUID()
  styleId?: string;

  @IsOptional()
  @IsUUID()
  gradeId?: string;
}

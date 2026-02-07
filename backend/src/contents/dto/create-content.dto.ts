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

    @IsUUID()
    styleId: string;

    @IsOptional()
    @IsUUID()
    gradeId?: string;
}

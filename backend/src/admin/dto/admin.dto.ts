import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { DojoRole, UserRole } from '@prisma/client';

export class CreateAdminUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsUUID()
  dojoId?: string;

  @IsOptional()
  @IsEnum(DojoRole)
  dojoRole?: DojoRole;

  @IsOptional()
  @IsUUID()
  gradeId?: string;
}

export class AssignUserToDojoDto {
  @IsUUID()
  dojoId: string;

  @IsEnum(DojoRole)
  dojoRole: DojoRole;

  @ValidateIf((o: AssignUserToDojoDto) => o.dojoRole === DojoRole.STUDENT)
  @IsUUID()
  gradeId?: string;
}

export class CreateAdminContentDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsEnum(['PDF', 'VIDEO', 'TEXT', 'LINK'] as const)
  type: 'PDF' | 'VIDEO' | 'TEXT' | 'LINK';

  @ValidateIf((o: CreateAdminContentDto) => o.type !== 'TEXT')
  @IsString()
  @MinLength(1)
  url?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsUUID()
  gradeId?: string;
}

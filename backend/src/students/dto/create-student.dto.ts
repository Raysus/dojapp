import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateStudentDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsString()
  name: string;

  @IsUUID()
  gradeId: string;
}

import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateStudentDto {
    @IsEmail()
    email: string;

    @MinLength(6)
    password: string;

    @IsString()
    name: string;

    @IsString()
    dojoId: string;

    @IsString()
    gradeId: string;
}

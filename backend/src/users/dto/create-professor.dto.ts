import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateProfessorDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    name: string;
}

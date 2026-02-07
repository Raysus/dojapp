import { IsUUID } from 'class-validator';

export class UpdateStudentGradeDto {
    @IsUUID()
    gradeId: string;
}
import { IsUUID } from 'class-validator';

export class AssignGradeDto {
  @IsUUID()
  gradeId: string;
}
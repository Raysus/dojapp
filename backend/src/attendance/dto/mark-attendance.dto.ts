import { IsBoolean, IsOptional, IsUUID, IsDateString } from 'class-validator'

export class MarkAttendanceDto {
    @IsUUID()
    userId: string

    @IsBoolean()
    present: boolean

    @IsOptional()
    @IsDateString()
    date?: string
}

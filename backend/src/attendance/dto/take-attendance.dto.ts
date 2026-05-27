import { IsArray, IsBoolean, IsDateString, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class AttendanceRecordDto {
    @IsString()
    userId: string

    @IsBoolean()
    present: boolean
}

export class TakeAttendanceDto {
    @IsDateString()
    date: string

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttendanceRecordDto)
    records: AttendanceRecordDto[]
}
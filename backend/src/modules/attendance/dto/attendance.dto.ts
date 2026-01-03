import { IsOptional, IsString, IsEnum, IsDateString } from "class-validator";
import { AttendanceStatus } from "@common/enums/attendance-status.enum";

export class CheckInDto {
  // Check-in is automatic with current timestamp
}

export class CheckOutDto {
  // Check-out is automatic with current timestamp
}

export class OverrideAttendanceDto {
  @IsString()
  employeeId!: string;

  @IsString()
  @IsDateString()
  date!: string; // ISO date format YYYY-MM-DD

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

import { IsString, IsDateString, IsOptional, IsEnum } from "class-validator";
import { LeaveType } from "@common/enums/leave-status.enum";

export class ApplyLeaveDto {
  @IsEnum(LeaveType)
  leaveType!: LeaveType;

  @IsDateString()
  startDate!: string; // ISO date format

  @IsDateString()
  endDate!: string; // ISO date format

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApproveLeaveDto {
  @IsOptional()
  @IsString()
  comments?: string;
}

export class RejectLeaveDto {
  @IsString()
  reason!: string;
}

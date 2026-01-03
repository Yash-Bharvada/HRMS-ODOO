import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseFilters,
} from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { OverrideAttendanceDto } from "./dto/attendance.dto";
import { JwtGuard } from "@common/guards/jwt.guard";
import { RolesGuard } from "@common/guards/roles.guard";
import { Roles } from "@common/decorators/roles.decorator";
import { User, RequestUser } from "@common/decorators/user.decorator";
import { Role } from "@common/enums/role.enum";
import { AllExceptionsFilter } from "@common/filters/all-exceptions.filter";

@Controller("attendance")
@UseFilters(AllExceptionsFilter)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post("check-in")
  @UseGuards(JwtGuard)
  async checkIn(@User() user: RequestUser) {
    // Get employee ID from user
    // This assumes the user has an employeeId or we need to fetch it
    // For now, using userId - you'll need to adjust based on your schema
    return this.attendanceService.checkIn(user.userId);
  }

  @Post("check-out")
  @UseGuards(JwtGuard)
  async checkOut(@User() user: RequestUser) {
    return this.attendanceService.checkOut(user.userId);
  }

  @Get("today")
  @UseGuards(JwtGuard)
  async getTodayAttendance(@User() user: RequestUser) {
    return this.attendanceService.getTodayAttendance(user.userId);
  }

  @Get("history")
  @UseGuards(JwtGuard)
  async getAttendanceHistory(
    @User() user: RequestUser,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.attendanceService.getEmployeeAttendanceHistory(
      user.userId,
      startDate,
      endDate
    );
  }

  @Get("stats/:month")
  @UseGuards(JwtGuard)
  async getAttendanceStats(
    @User() user: RequestUser,
    @Param("month") month: string
  ) {
    return this.attendanceService.getAttendanceStats(user.userId, month);
  }

  @Get(":date")
  @UseGuards(JwtGuard)
  async getAttendanceByDate(
    @User() user: RequestUser,
    @Param("date") date: string
  ) {
    return this.attendanceService.getAttendanceByDate(user.userId, date);
  }

  @Post("override")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async overrideAttendance(
    @User() user: RequestUser,
    @Body() overrideDto: OverrideAttendanceDto
  ) {
    return this.attendanceService.overrideAttendance(overrideDto, user.userId);
  }
}

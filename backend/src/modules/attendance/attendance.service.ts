import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  ConflictException,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AttendanceStatus } from "@common/enums/attendance-status.enum";
import { OverrideAttendanceDto } from "./dto/attendance.dto";

@Injectable()
export class AttendanceService {
  constructor(@Inject("PrismaClient") private prisma: PrismaClient) {}

  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  async checkIn(employeeId: string) {
    const today = this.getTodayDate();

    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    // Check if already checked in today
    const existingRecord = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (existingRecord && existingRecord.checkInTime) {
      throw new ConflictException("Already checked in today");
    }

    // Create or update attendance record
    return this.prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
      create: {
        employeeId,
        date: today,
        checkInTime: new Date(),
        status: AttendanceStatus.PRESENT,
      },
      update: {
        checkInTime: new Date(),
        status: AttendanceStatus.PRESENT,
      },
    });
  }

  async checkOut(employeeId: string) {
    const today = this.getTodayDate();

    const attendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (!attendance) {
      throw new BadRequestException(
        "No check-in record found for today. Please check in first"
      );
    }

    if (!attendance.checkInTime) {
      throw new BadRequestException("Must check in before checking out");
    }

    if (attendance.checkOutTime) {
      throw new ConflictException("Already checked out today");
    }

    return this.prisma.attendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        checkOutTime: new Date(),
      },
    });
  }

  async getTodayAttendance(employeeId: string) {
    const today = this.getTodayDate();

    const attendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    return attendance || { message: "No attendance record for today" };
  }

  async getAttendanceByDate(employeeId: string, date: string) {
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: parsedDate,
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException("Attendance record not found");
    }

    return attendance;
  }

  async getEmployeeAttendanceHistory(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ) {
    const filter: any = { employeeId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.lte = end;
      }
    }

    return this.prisma.attendance.findMany({
      where: filter,
      orderBy: { date: "desc" },
    });
  }

  async overrideAttendance(
    overrideDto: OverrideAttendanceDto,
    adminId: string
  ) {
    const { employeeId, date, status, reason } = overrideDto;

    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: parsedDate,
        },
      },
      create: {
        employeeId,
        date: parsedDate,
        status,
        overriddenBy: adminId,
        overrideReason: reason,
      },
      update: {
        status,
        overriddenBy: adminId,
        overrideReason: reason,
      },
    });

    // Log the override action
    await this.prisma.auditLog.create({
      data: {
        action: "OVERRIDE",
        userId: adminId,
        entityType: "Attendance",
        entityId: attendance.id,
        reason: reason || "Attendance override",
        changes: JSON.stringify({
          previousStatus: "N/A",
          newStatus: status,
        }),
      },
    });

    return attendance;
  }

  async getAttendanceStats(employeeId: string, month: string) {
    const [year, monthNum] = month.split("-").map(Number);

    const startDate = new Date(year, monthNum - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, monthNum, 0);
    endDate.setHours(23, 59, 59, 999);

    const records = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const stats = {
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      total: records.length,
    };

    records.forEach((record) => {
      switch (record.status) {
        case AttendanceStatus.PRESENT:
          stats.present++;
          break;
        case AttendanceStatus.ABSENT:
          stats.absent++;
          break;
        case AttendanceStatus.HALF_DAY:
          stats.halfDay++;
          break;
        case AttendanceStatus.LEAVE:
          stats.leave++;
          break;
      }
    });

    return stats;
  }
}

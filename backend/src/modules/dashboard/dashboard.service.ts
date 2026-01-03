import { Injectable, Inject } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class DashboardService {
  constructor(@Inject("PrismaClient") private prisma: PrismaClient) {}

  async getDashboardSummary(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return { message: "Employee profile not found" };
    }

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
    });

    // Get pending leave requests count
    const pendingLeaves = await this.prisma.leave.count({
      where: {
        employeeId: employee.id,
        status: "PENDING",
      },
    });

    // Get latest payroll
    const latestPayroll = await this.prisma.payroll.findFirst({
      where: { employeeId: employee.id },
      orderBy: { month: "desc" },
      take: 1,
    });

    return {
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        department: employee.department,
        designation: employee.designation,
      },
      todayAttendance: todayAttendance || { status: "Not checked in" },
      pendingLeaves,
      latestPayroll,
    };
  }

  async getStatistics(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return { message: "Employee profile not found" };
    }

    // Get current month attendance stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthAttendance = await this.prisma.attendance.groupBy({
      by: ["status"],
      where: {
        employeeId: employee.id,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _count: true,
    });

    return {
      month: monthStart.toISOString().split("T")[0],
      attendanceStats: monthAttendance.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

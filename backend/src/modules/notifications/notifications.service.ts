import { Inject, Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class NotificationsService {
  constructor(@Inject("PrismaClient") private prisma: PrismaClient) {}

  async getNotifications(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return { notifications: [], metadata: { employeeFound: false } };
    }

    const [auditLogs, leaves, payrolls] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.leave.findMany({
        where: { employeeId: employee.id },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      this.prisma.payroll.findMany({
        where: { employeeId: employee.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    const notifications = [
      ...auditLogs.map((log) => ({
        type: "AUDIT" as const,
        message: `${log.action} ${log.entityType}`,
        createdAt: log.createdAt,
        metadata: {
          entityId: log.entityId,
          reason: log.reason ?? undefined,
        },
      })),
      ...leaves.map((leave) => ({
        type: "LEAVE" as const,
        message: `Leave ${leave.status} from ${
          leave.startDate.toISOString().split("T")[0]
        } to ${leave.endDate.toISOString().split("T")[0]}`,
        createdAt: leave.updatedAt ?? leave.createdAt,
        metadata: {
          leaveId: leave.id,
          status: leave.status,
        },
      })),
      ...payrolls.map((payroll) => ({
        type: "PAYROLL" as const,
        message: `Payroll updated for ${
          payroll.month.toISOString().split("T")[0]
        }`,
        createdAt: payroll.updatedAt ?? payroll.createdAt,
        metadata: {
          payrollId: payroll.id,
          netSalary: payroll.netSalary.toString(),
        },
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { notifications };
  }
}

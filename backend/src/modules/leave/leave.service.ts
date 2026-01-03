import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  ConflictException,
} from "@nestjs/common";
import { PrismaClient, Employee } from "@prisma/client";
import {
  ApplyLeaveDto,
  ApproveLeaveDto,
  RejectLeaveDto,
} from "./dto/leave.dto";
import { LeaveStatus } from "@common/enums/leave-status.enum";
import { AttendanceStatus } from "@common/enums/attendance-status.enum";

@Injectable()
export class LeaveService {
  constructor(@Inject("PrismaClient") private prisma: PrismaClient) {}

  private async findEmployeeOrThrow(userId: string): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    return employee;
  }

  async applyLeave(userId: string, applyLeaveDto: ApplyLeaveDto) {
    const { id: employeeId } = await this.findEmployeeOrThrow(userId);
    const { leaveType, startDate, endDate, reason } = applyLeaveDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestException("Start date must be before end date");
    }

    // Check for overlapping leave requests
    const overlappingLeave = await this.prisma.leave.findFirst({
      where: {
        employeeId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlappingLeave) {
      throw new ConflictException(
        "You already have a leave request that overlaps with these dates"
      );
    }

    return this.prisma.leave.create({
      data: {
        employeeId,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        status: LeaveStatus.PENDING,
      },
    });
  }

  async getMyLeaveRequests(userId: string) {
    const { id: employeeId } = await this.findEmployeeOrThrow(userId);

    return this.prisma.leave.findMany({
      where: { employeeId },
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                firstName: true,
                lastName: true,
                user: { select: { email: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLeaveRequestById(leaveId: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                firstName: true,
                lastName: true,
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });

    if (!leave) {
      throw new NotFoundException("Leave request not found");
    }

    return leave;
  }

  async getAllPendingLeaveRequests() {
    return this.prisma.leave.findMany({
      where: { status: LeaveStatus.PENDING },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            user: { select: { email: true } },
          },
        },
        approvals: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveLeave(
    leaveId: string,
    adminId: string,
    approveDto: ApproveLeaveDto
  ) {
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new NotFoundException("Leave request not found");
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve a ${leave.status} leave request`
      );
    }

    // Use transaction to update leave and create attendance records
    return this.prisma.$transaction(async (tx) => {
      // Update leave status
      const updatedLeave = await tx.leave.update({
        where: { id: leaveId },
        data: { status: LeaveStatus.APPROVED },
      });

      // Create approval record
      const approver = await tx.employee.findUnique({
        where: { userId: adminId },
      });

      if (!approver) {
        throw new BadRequestException("Approver is not an employee");
      }

      await tx.leaveApproval.create({
        data: {
          leaveId,
          approvedBy: approver.id,
          comments: approveDto.comments,
        },
      });

      // Update attendance records for all days in the leave period
      const currentDate = new Date(leave.startDate);
      while (currentDate <= leave.endDate) {
        const date = new Date(currentDate);
        date.setHours(0, 0, 0, 0);

        await tx.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: leave.employeeId,
              date,
            },
          },
          create: {
            employeeId: leave.employeeId,
            date,
            status: AttendanceStatus.LEAVE,
          },
          update: {
            status: AttendanceStatus.LEAVE,
          },
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Log the approval
      await tx.auditLog.create({
        data: {
          action: "APPROVE",
          userId: adminId,
          entityType: "Leave",
          entityId: leaveId,
          reason: "Leave request approved",
          changes: JSON.stringify({
            status: LeaveStatus.APPROVED,
            comments: approveDto.comments,
          }),
        },
      });

      return updatedLeave;
    });
  }

  async rejectLeave(
    leaveId: string,
    adminId: string,
    rejectDto: RejectLeaveDto
  ) {
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new NotFoundException("Leave request not found");
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject a ${leave.status} leave request`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedLeave = await tx.leave.update({
        where: { id: leaveId },
        data: { status: LeaveStatus.REJECTED },
      });

      // Log the rejection
      await tx.auditLog.create({
        data: {
          action: "REJECT",
          userId: adminId,
          entityType: "Leave",
          entityId: leaveId,
          reason: rejectDto.reason,
        },
      });

      return updatedLeave;
    });
  }
}

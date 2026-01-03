import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { PrismaClient, Employee } from "@prisma/client";
import { CreatePayrollDto, UpdatePayrollDto } from "./dto/payroll.dto";

@Injectable()
export class PayrollService {
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

  private calculateNetSalary(
    baseSalary: number,
    allowances: number = 0,
    deductions: number = 0
  ): number {
    return baseSalary + allowances - deductions;
  }

  async createPayroll(
    employeeId: string,
    createPayrollDto: CreatePayrollDto,
    adminId: string
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    const {
      baseSalary,
      allowances = 0,
      deductions = 0,
      effectiveDate,
    } = createPayrollDto;

    if (baseSalary < 0 || allowances < 0 || deductions < 0) {
      throw new BadRequestException("Salary components cannot be negative");
    }

    const netSalary = this.calculateNetSalary(
      baseSalary,
      allowances,
      deductions
    );

    const effectiveDateTime = new Date(effectiveDate);
    const month = new Date(
      effectiveDateTime.getFullYear(),
      effectiveDateTime.getMonth(),
      1
    );

    // Check if payroll already exists for this month
    const existingPayroll = await this.prisma.payroll.findUnique({
      where: {
        employeeId_month: {
          employeeId,
          month,
        },
      },
    });

    if (existingPayroll) {
      throw new BadRequestException(
        `Payroll already exists for this employee in ${
          month.toISOString().split("T")[0]
        }`
      );
    }

    const payroll = await this.prisma.payroll.create({
      data: {
        employeeId,
        month,
        baseSalary,
        allowances,
        deductions,
        netSalary,
        effectiveDate: effectiveDateTime,
      },
    });

    // Log the payroll creation
    await this.prisma.auditLog.create({
      data: {
        action: "CREATE",
        userId: adminId,
        entityType: "Payroll",
        entityId: payroll.id,
        reason: "Payroll created",
        changes: JSON.stringify({
          baseSalary,
          allowances,
          deductions,
          netSalary,
        }),
      },
    });

    return payroll;
  }

  async getMyPayroll(userId: string) {
    const { id: employeeId } = await this.findEmployeeOrThrow(userId);

    const payrolls = await this.prisma.payroll.findMany({
      where: { employeeId },
      orderBy: { month: "desc" },
    });

    if (payrolls.length === 0) {
      throw new NotFoundException("No payroll records found");
    }

    return payrolls;
  }

  async getPayrollByMonth(userId: string, month: string) {
    const { id: employeeId } = await this.findEmployeeOrThrow(userId);
    const [year, monthNum] = month.split("-").map(Number);
    const monthDate = new Date(year, monthNum - 1, 1);

    const payroll = await this.prisma.payroll.findUnique({
      where: {
        employeeId_month: {
          employeeId,
          month: monthDate,
        },
      },
    });

    if (!payroll) {
      throw new NotFoundException("Payroll record not found for this month");
    }

    return payroll;
  }

  async getEmployeePayroll(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    return this.prisma.payroll.findMany({
      where: { employeeId },
      orderBy: { month: "desc" },
    });
  }

  async updatePayroll(
    payrollId: string,
    updateDto: UpdatePayrollDto,
    adminId: string
  ) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) {
      throw new NotFoundException("Payroll record not found");
    }

    const baseSalary = updateDto.baseSalary ?? Number(payroll.baseSalary);
    const allowances = updateDto.allowances ?? Number(payroll.allowances);
    const deductions = updateDto.deductions ?? Number(payroll.deductions);
    const effectiveDate = updateDto.effectiveDate
      ? new Date(updateDto.effectiveDate)
      : payroll.effectiveDate;

    if (baseSalary < 0 || allowances < 0 || deductions < 0) {
      throw new BadRequestException("Salary components cannot be negative");
    }

    const netSalary = this.calculateNetSalary(
      baseSalary,
      allowances,
      deductions
    );

    const updatedPayroll = await this.prisma.payroll.update({
      where: { id: payrollId },
      data: {
        baseSalary,
        allowances,
        deductions,
        netSalary,
        effectiveDate,
      },
    });

    // Log the update
    await this.prisma.auditLog.create({
      data: {
        action: "UPDATE",
        userId: adminId,
        entityType: "Payroll",
        entityId: payrollId,
        reason: "Payroll updated",
        changes: JSON.stringify({
          previousBaseSalary: Number(payroll.baseSalary),
          newBaseSalary: baseSalary,
          previousAllowances: Number(payroll.allowances),
          newAllowances: allowances,
          previousDeductions: Number(payroll.deductions),
          newDeductions: deductions,
          previousNetSalary: Number(payroll.netSalary),
          newNetSalary: netSalary,
          previousEffectiveDate: payroll.effectiveDate,
          newEffectiveDate: effectiveDate,
        }),
      },
    });

    return updatedPayroll;
  }

  async getAllEmployeesPayroll(month?: string) {
    const filter: any = {};

    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      const monthDate = new Date(year, monthNum - 1, 1);
      const nextMonth = new Date(year, monthNum, 1);

      filter.month = {
        gte: monthDate,
        lt: nextMonth,
      };
    }

    return this.prisma.payroll.findMany({
      where: filter,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
            user: { select: { email: true } },
          },
        },
      },
      orderBy: [{ month: "desc" }, { employee: { firstName: "asc" } }],
    });
  }
}

import { PrismaClient } from '@prisma/client';

export class DatabaseValidator {
  constructor(private prisma: PrismaClient) {}

  async validateSchema(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if all required tables exist
      const requiredTables = [
        'User',
        'Employee', 
        'Attendance',
        'Leave',
        'LeaveApproval',
        'Payroll',
        'RefreshToken',
        'AuditLog'
      ];

      for (const table of requiredTables) {
        try {
          await this.prisma.$queryRaw`SELECT 1 FROM ${table} LIMIT 1`;
        } catch (error) {
          errors.push(`Table ${table} does not exist or is not accessible`);
        }
      }

      // Validate foreign key constraints
      await this.validateForeignKeys(errors);

      // Validate indexes
      await this.validateIndexes(errors);

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(`Database validation failed: ${error instanceof Error ? error.message : String(error)}`);
      return { valid: false, errors };
    }
  }

  private async validateForeignKeys(errors: string[]): Promise<void> {
    try {
      // Test User -> Employee relationship
      const userWithEmployee = await this.prisma.user.findFirst({
        include: { employee: true }
      });

      // Test Employee -> Attendance relationship
      const employeeWithAttendance = await this.prisma.employee.findFirst({
        include: { attendanceRecords: true }
      });

      // Test Employee -> Leave relationship
      const employeeWithLeave = await this.prisma.employee.findFirst({
        include: { leaveRequests: true }
      });

      // Test Employee -> Payroll relationship
      const employeeWithPayroll = await this.prisma.employee.findFirst({
        include: { payrollRecords: true }
      });

      // Test Leave -> LeaveApproval relationship
      const leaveWithApprovals = await this.prisma.leave.findFirst({
        include: { approvals: true }
      });

    } catch (error) {
      errors.push(`Foreign key validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateIndexes(errors: string[]): Promise<void> {
    try {
      // Check if indexes exist by running queries that would benefit from them
      await this.prisma.user.findMany({
        where: { email: { contains: 'test' } }
      });

      await this.prisma.employee.findMany({
        where: { department: { contains: 'IT' } }
      });

      await this.prisma.attendance.findMany({
        where: { 
          date: { 
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31')
          }
        }
      });

    } catch (error) {
      errors.push(`Index validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateDataIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check for orphaned records - employees without users
      const allEmployees = await this.prisma.employee.findMany({
        include: { user: true }
      });
      
      const orphanedEmployees = allEmployees.filter(emp => !emp.user);
      
      if (orphanedEmployees.length > 0) {
        errors.push(`Found ${orphanedEmployees.length} orphaned employee records`);
      }

      // Check for invalid attendance records
      const invalidAttendance = await this.prisma.attendance.findMany({
        where: {
          AND: [
            { checkInTime: { not: null } },
            { checkOutTime: { not: null } },
            { checkOutTime: { lt: this.prisma.attendance.fields.checkInTime } }
          ]
        }
      });

      if (invalidAttendance.length > 0) {
        errors.push(`Found ${invalidAttendance.length} attendance records with check-out before check-in`);
      }

      // Check for invalid leave date ranges
      const invalidLeaves = await this.prisma.leave.findMany({
        where: {
          endDate: { lt: this.prisma.leave.fields.startDate }
        }
      });

      if (invalidLeaves.length > 0) {
        errors.push(`Found ${invalidLeaves.length} leave requests with end date before start date`);
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(`Data integrity validation failed: ${error instanceof Error ? error.message : String(error)}`);
      return { valid: false, errors };
    }
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { AuthService } from '../../modules/auth/auth.service';

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

@Injectable()
export class IntegrationValidator {
  private readonly logger = new Logger(IntegrationValidator.name);

  constructor(
    private prisma: PrismaService,
    private authService: AuthService
  ) {}

  async validateCompleteWorkflow(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      // Test 1: User Authentication Flow
      results.push(await this.validateAuthenticationFlow());

      // Test 2: CRUD Operations
      results.push(await this.validateCrudOperations());

      // Test 3: Data Relationships
      results.push(await this.validateDataRelationships());

      // Test 4: Error Scenarios
      results.push(await this.validateErrorScenarios());

      return results;
    } catch (error) {
      this.logger.error('Integration validation failed:', error);
      return [{
        success: false,
        message: 'Integration validation failed',
        details: error instanceof Error ? error.message : String(error)
      }];
    }
  }

  private async validateAuthenticationFlow(): Promise<ValidationResult> {
    try {
      // Create test user
      const testUser = await this.prisma.user.create({
        data: {
          email: 'integration-test@example.com',
          password: 'hashedPassword',
          role: 'EMPLOYEE',
          employee: {
            create: {
              firstName: 'Integration',
              lastName: 'Test',
              department: 'Testing'
            }
          }
        },
        include: { employee: true }
      });

      // Test login
      const loginResult = await this.authService.login(
        'integration-test@example.com',
        'hashedPassword'
      );

      // Verify JWT token
      if (!loginResult.accessToken) {
        throw new Error('No access token generated');
      }

      // Test token refresh
      const refreshResult = await this.authService.refreshToken(
        loginResult.refreshToken
      );

      if (!refreshResult.accessToken) {
        throw new Error('Token refresh failed');
      }

      // Cleanup
      if (testUser.employee) {
        await this.prisma.employee.delete({
          where: { id: testUser.employee.id }
        });
      }
      await this.prisma.user.delete({
        where: { id: testUser.id }
      });

      return {
        success: true,
        message: 'Authentication flow validation passed'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Authentication flow validation failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async validateCrudOperations(): Promise<ValidationResult> {
    try {
      // Create test employee
      const employee = await this.prisma.employee.create({
        data: {
          firstName: 'CRUD',
          lastName: 'Test',
          department: 'Testing',
          user: {
            create: {
              email: 'crud-test@example.com',
              password: 'hashedPassword',
              role: 'EMPLOYEE'
            }
          }
        },
        include: { user: true }
      });

      // Test attendance CRUD
      const attendance = await this.prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date: new Date(),
          checkInTime: new Date(),
          status: 'PRESENT'
        }
      });

      // Update attendance
      const updatedAttendance = await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: { checkOutTime: new Date() }
      });

      if (!updatedAttendance.checkOutTime) {
        throw new Error('Attendance update failed');
      }

      // Test leave CRUD
      const leave = await this.prisma.leave.create({
        data: {
          employeeId: employee.id,
          leaveType: 'PAID',
          startDate: new Date(),
          endDate: new Date(),
          reason: 'Test leave'
        }
      });

      // Test payroll CRUD
      const payroll = await this.prisma.payroll.create({
        data: {
          employeeId: employee.id,
          month: new Date(),
          baseSalary: 50000,
          allowances: 0,
          deductions: 0,
          netSalary: 50000,
          effectiveDate: new Date()
        }
      });

      // Cleanup
      await this.prisma.payroll.delete({ where: { id: payroll.id } });
      await this.prisma.leave.delete({ where: { id: leave.id } });
      await this.prisma.attendance.delete({ where: { id: attendance.id } });
      await this.prisma.employee.delete({ where: { id: employee.id } });
      await this.prisma.user.delete({ where: { id: employee.user.id } });

      return {
        success: true,
        message: 'CRUD operations validation passed'
      };
    } catch (error) {
      return {
        success: false,
        message: 'CRUD operations validation failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async validateDataRelationships(): Promise<ValidationResult> {
    try {
      // Test foreign key relationships
      const user = await this.prisma.user.create({
        data: {
          email: 'relationship-test@example.com',
          password: 'hashedPassword',
          role: 'EMPLOYEE',
          employee: {
            create: {
              firstName: 'Relationship',
              lastName: 'Test',
              department: 'Testing',
              attendanceRecords: {
                create: {
                  date: new Date(),
                  status: 'PRESENT'
                }
              },
              leaveRequests: {
                create: {
                  leaveType: 'PAID',
                  startDate: new Date(),
                  endDate: new Date(),
                  reason: 'Test'
                }
              }
            }
          }
        },
        include: {
          employee: {
            include: {
              attendanceRecords: true,
              leaveRequests: true
            }
          }
        }
      });

      // Verify relationships
      if (!user.employee) {
        throw new Error('User-Employee relationship failed');
      }

      if (user.employee.attendanceRecords.length === 0) {
        throw new Error('Employee-Attendance relationship failed');
      }

      if (user.employee.leaveRequests.length === 0) {
        throw new Error('Employee-Leave relationship failed');
      }

      // Cleanup
      await this.prisma.leave.deleteMany({
        where: { employeeId: user.employee.id }
      });
      await this.prisma.attendance.deleteMany({
        where: { employeeId: user.employee.id }
      });
      await this.prisma.employee.delete({
        where: { id: user.employee.id }
      });
      await this.prisma.user.delete({
        where: { id: user.id }
      });

      return {
        success: true,
        message: 'Data relationships validation passed'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Data relationships validation failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async validateErrorScenarios(): Promise<ValidationResult> {
    try {
      // Test constraint violations
      let constraintViolationCaught = false;
      try {
        await this.prisma.user.create({
          data: {
            email: 'duplicate@example.com',
            password: 'password',
            role: 'EMPLOYEE'
          }
        });
        
        // This should fail due to duplicate email
        await this.prisma.user.create({
          data: {
            email: 'duplicate@example.com',
            password: 'password',
            role: 'EMPLOYEE'
          }
        });
      } catch (error) {
        constraintViolationCaught = true;
        // Cleanup
        await this.prisma.user.deleteMany({
          where: { email: 'duplicate@example.com' }
        });
      }

      if (!constraintViolationCaught) {
        throw new Error('Constraint violation not caught');
      }

      return {
        success: true,
        message: 'Error scenarios validation passed'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error scenarios validation failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
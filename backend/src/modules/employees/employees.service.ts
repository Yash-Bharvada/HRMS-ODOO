import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import {
  UpdateEmployeeDto,
  UpdateEmployeeByAdminDto,
} from "./dto/employee.dto";
import { Role } from "@common/enums/role.enum";

@Injectable()
export class EmployeesService {
  constructor(@Inject("PrismaClient") private prisma: PrismaClient) {}

  async getEmployeeById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true, role: true, isActive: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    return employee;
  }

  async getAllEmployees() {
    return this.prisma.employee.findMany({
      include: {
        user: {
          select: { email: true, role: true, isActive: true },
        },
      },
    });
  }

  async updateEmployee(
    employeeId: string,
    updateDto: UpdateEmployeeDto,
    userId: string,
    userRole: Role
  ) {
    // Verify employee exists and user owns it or is admin
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    // Authorization check
    if (userRole !== Role.ADMIN && employee.userId !== userId) {
      throw new ForbiddenException("You can only update your own profile");
    }

    // Employees can only update specific fields
    if (userRole === Role.EMPLOYEE) {
      const allowedFields = ["phone", "address", "profilePictureUrl"];
      const updateFields = Object.keys(updateDto);
      const unauthorizedFields = updateFields.filter(
        (field) => !allowedFields.includes(field)
      );

      if (unauthorizedFields.length > 0) {
        throw new ForbiddenException(
          `Employees cannot update: ${unauthorizedFields.join(
            ", "
          )}. You can only update: ${allowedFields.join(", ")}`
        );
      }
    }

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: updateDto,
      include: {
        user: {
          select: { email: true, role: true, isActive: true },
        },
      },
    });
  }

  async getMyProfile(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: {
          select: { email: true, role: true, isActive: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException("Employee profile not found");
    }

    return employee;
  }

  async updateMyProfile(userId: string, updateDto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      throw new NotFoundException("Employee profile not found");
    }

    // Employees can only update specific fields
    const allowedFields = ["phone", "address", "profilePictureUrl"];
    const updateFields = Object.keys(updateDto).filter(
      (key) => updateDto[key as keyof UpdateEmployeeDto] !== undefined
    );
    const unauthorizedFields = updateFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (unauthorizedFields.length > 0) {
      throw new ForbiddenException(
        `You cannot update: ${unauthorizedFields.join(
          ", "
        )}. You can only update: ${allowedFields.join(", ")}`
      );
    }

    return this.prisma.employee.update({
      where: { id: employee.id },
      data: updateDto,
      include: {
        user: {
          select: { email: true, role: true, isActive: true },
        },
      },
    });
  }
}

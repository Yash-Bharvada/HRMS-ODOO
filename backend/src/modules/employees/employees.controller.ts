import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  UseFilters,
} from "@nestjs/common";
import { EmployeesService } from "./employees.service";
import {
  UpdateEmployeeDto,
  UpdateEmployeeByAdminDto,
} from "./dto/employee.dto";
import { JwtGuard } from "@common/guards/jwt.guard";
import { RolesGuard } from "@common/guards/roles.guard";
import { Roles } from "@common/decorators/roles.decorator";
import { User, RequestUser } from "@common/decorators/user.decorator";
import { Role } from "@common/enums/role.enum";
import { AllExceptionsFilter } from "@common/filters/all-exceptions.filter";

@Controller("employees")
@UseFilters(AllExceptionsFilter)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get("me")
  @UseGuards(JwtGuard)
  async getMyProfile(@User() user: RequestUser) {
    return this.employeesService.getMyProfile(user.userId);
  }

  @Put("me")
  @UseGuards(JwtGuard)
  async updateMyProfile(
    @User() user: RequestUser,
    @Body() updateDto: UpdateEmployeeDto
  ) {
    return this.employeesService.updateMyProfile(user.userId, updateDto);
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllEmployees() {
    return this.employeesService.getAllEmployees();
  }

  @Get(":id")
  @UseGuards(JwtGuard)
  async getEmployeeById(@Param("id") id: string) {
    return this.employeesService.getEmployeeById(id);
  }

  @Put(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  async updateEmployee(
    @Param("id") id: string,
    @User() user: RequestUser,
    @Body() updateDto: UpdateEmployeeByAdminDto
  ) {
    return this.employeesService.updateEmployee(
      id,
      updateDto,
      user.userId,
      user.role as Role
    );
  }
}

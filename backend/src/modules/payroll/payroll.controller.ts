import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  UseFilters,
} from "@nestjs/common";
import { PayrollService } from "./payroll.service";
import { CreatePayrollDto, UpdatePayrollDto } from "./dto/payroll.dto";
import { JwtGuard } from "@common/guards/jwt.guard";
import { RolesGuard } from "@common/guards/roles.guard";
import { Roles } from "@common/decorators/roles.decorator";
import { User, RequestUser } from "@common/decorators/user.decorator";
import { Role } from "@common/enums/role.enum";
import { AllExceptionsFilter } from "@common/filters/all-exceptions.filter";

@Controller("payroll")
@UseFilters(AllExceptionsFilter)
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Get("me")
  @UseGuards(JwtGuard)
  async getMyPayroll(@User() user: RequestUser) {
    return this.payrollService.getMyPayroll(user.userId);
  }

  @Get("me/:month")
  @UseGuards(JwtGuard)
  async getMyPayrollByMonth(
    @User() user: RequestUser,
    @Param("month") month: string
  ) {
    return this.payrollService.getPayrollByMonth(user.userId, month);
  }

  @Post(":employeeId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createPayroll(
    @Param("employeeId") employeeId: string,
    @Body() createPayrollDto: CreatePayrollDto,
    @User() user: RequestUser
  ) {
    return this.payrollService.createPayroll(
      employeeId,
      createPayrollDto,
      user.userId
    );
  }

  @Get("employee/:employeeId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getEmployeePayroll(@Param("employeeId") employeeId: string) {
    return this.payrollService.getEmployeePayroll(employeeId);
  }

  @Put(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updatePayroll(
    @Param("id") id: string,
    @Body() updatePayrollDto: UpdatePayrollDto,
    @User() user: RequestUser
  ) {
    return this.payrollService.updatePayroll(id, updatePayrollDto, user.userId);
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllEmployeesPayroll(@Query("month") month?: string) {
    return this.payrollService.getAllEmployeesPayroll(month);
  }
}

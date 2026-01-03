import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseFilters,
  Put,
} from "@nestjs/common";
import { LeaveService } from "./leave.service";
import {
  ApplyLeaveDto,
  ApproveLeaveDto,
  RejectLeaveDto,
} from "./dto/leave.dto";
import { JwtGuard } from "@common/guards/jwt.guard";
import { RolesGuard } from "@common/guards/roles.guard";
import { Roles } from "@common/decorators/roles.decorator";
import { User, RequestUser } from "@common/decorators/user.decorator";
import { Role } from "@common/enums/role.enum";
import { AllExceptionsFilter } from "@common/filters/all-exceptions.filter";

@Controller("leave")
@UseFilters(AllExceptionsFilter)
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Post("apply")
  @UseGuards(JwtGuard)
  async applyLeave(
    @User() user: RequestUser,
    @Body() applyLeaveDto: ApplyLeaveDto
  ) {
    return this.leaveService.applyLeave(user.userId, applyLeaveDto);
  }

  @Get("my-requests")
  @UseGuards(JwtGuard)
  async getMyLeaveRequests(@User() user: RequestUser) {
    return this.leaveService.getMyLeaveRequests(user.userId);
  }

  @Get("pending")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getPendingLeaveRequests() {
    return this.leaveService.getAllPendingLeaveRequests();
  }

  @Get(":id")
  @UseGuards(JwtGuard)
  async getLeaveRequestById(@Param("id") id: string) {
    return this.leaveService.getLeaveRequestById(id);
  }

  @Put(":id/approve")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveLeave(
    @Param("id") id: string,
    @User() user: RequestUser,
    @Body() approveDto: ApproveLeaveDto
  ) {
    return this.leaveService.approveLeave(id, user.userId, approveDto);
  }

  @Put(":id/reject")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async rejectLeave(
    @Param("id") id: string,
    @User() user: RequestUser,
    @Body() rejectDto: RejectLeaveDto
  ) {
    return this.leaveService.rejectLeave(id, user.userId, rejectDto);
  }
}

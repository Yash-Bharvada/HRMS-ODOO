import { Controller, Get, UseGuards, UseFilters } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtGuard } from "@common/guards/jwt.guard";
import { User, RequestUser } from "@common/decorators/user.decorator";
import { AllExceptionsFilter } from "@common/filters/all-exceptions.filter";

@Controller("dashboard")
@UseFilters(AllExceptionsFilter)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get("summary")
  @UseGuards(JwtGuard)
  async getDashboardSummary(@User() user: RequestUser) {
    return this.dashboardService.getDashboardSummary(user.userId);
  }

  @Get("statistics")
  @UseGuards(JwtGuard)
  async getStatistics(@User() user: RequestUser) {
    return this.dashboardService.getStatistics(user.userId);
  }
}

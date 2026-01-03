import { Controller, Get, UseGuards, UseFilters } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtGuard } from "@common/guards/jwt.guard";
import { User, RequestUser } from "@common/decorators/user.decorator";
import { AllExceptionsFilter } from "@common/filters/all-exceptions.filter";

@Controller("notifications")
@UseFilters(AllExceptionsFilter)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtGuard)
  async getNotifications(@User() user: RequestUser) {
    return this.notificationsService.getNotifications(user.userId);
  }
}

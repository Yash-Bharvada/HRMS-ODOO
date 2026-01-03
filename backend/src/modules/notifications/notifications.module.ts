import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { getPrismaClient } from "@config/database.config";

@Module({
  providers: [
    NotificationsService,
    {
      provide: "PrismaClient",
      useValue: getPrismaClient(),
    },
  ],
  controllers: [NotificationsController],
})
export class NotificationsModule {}

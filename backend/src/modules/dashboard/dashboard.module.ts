import { Module } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";
import { getPrismaClient } from "@config/database.config";

@Module({
  providers: [
    DashboardService,
    {
      provide: "PrismaClient",
      useValue: getPrismaClient(),
    },
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}

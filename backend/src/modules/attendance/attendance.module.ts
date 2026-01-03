import { Module } from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { AttendanceController } from "./attendance.controller";
import { getPrismaClient } from "@config/database.config";

@Module({
  providers: [
    AttendanceService,
    {
      provide: "PrismaClient",
      useValue: getPrismaClient(),
    },
  ],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}

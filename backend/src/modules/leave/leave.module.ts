import { Module } from "@nestjs/common";
import { LeaveService } from "./leave.service";
import { LeaveController } from "./leave.controller";
import { getPrismaClient } from "@config/database.config";

@Module({
  providers: [
    LeaveService,
    {
      provide: "PrismaClient",
      useValue: getPrismaClient(),
    },
  ],
  controllers: [LeaveController],
  exports: [LeaveService],
})
export class LeaveModule {}

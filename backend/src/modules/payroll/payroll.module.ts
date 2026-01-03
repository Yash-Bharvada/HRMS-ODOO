import { Module } from "@nestjs/common";
import { PayrollService } from "./payroll.service";
import { PayrollController } from "./payroll.controller";
import { getPrismaClient } from "@config/database.config";

@Module({
  providers: [
    PayrollService,
    {
      provide: "PrismaClient",
      useValue: getPrismaClient(),
    },
  ],
  controllers: [PayrollController],
  exports: [PayrollService],
})
export class PayrollModule {}

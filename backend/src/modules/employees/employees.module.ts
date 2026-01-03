import { Module } from "@nestjs/common";
import { EmployeesService } from "./employees.service";
import { EmployeesController } from "./employees.controller";
import { getPrismaClient } from "@config/database.config";

@Module({
  providers: [
    EmployeesService,
    {
      provide: "PrismaClient",
      useValue: getPrismaClient(),
    },
  ],
  controllers: [EmployeesController],
  exports: [EmployeesService],
})
export class EmployeesModule {}

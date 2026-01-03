import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { getPrismaClient } from "@config/database.config";

@Module({
  providers: [
    UsersService,
    {
      provide: "PrismaClient",
      useValue: getPrismaClient(),
    },
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

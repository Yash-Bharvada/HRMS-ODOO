import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { getPrismaClient } from "@config/database.config";

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
  ],
  providers: [
    AuthService,
    {
      provide: "PrismaClient",
      useValue: getPrismaClient(),
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

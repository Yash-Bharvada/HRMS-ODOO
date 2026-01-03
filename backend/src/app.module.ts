import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "@modules/auth/auth.module";
import { UsersModule } from "@modules/users/users.module";
import { EmployeesModule } from "@modules/employees/employees.module";
import { AttendanceModule } from "@modules/attendance/attendance.module";
import { LeaveModule } from "@modules/leave/leave.module";
import { PayrollModule } from "@modules/payroll/payroll.module";
import { DashboardModule } from "@modules/dashboard/dashboard.module";
import { NotificationsModule } from "@modules/notifications/notifications.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    AuthModule,
    UsersModule,
    EmployeesModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    DashboardModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

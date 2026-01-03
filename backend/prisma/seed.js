require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.leaveApproval.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleaned existing data");

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@dayflow.com",
      password: hashedPassword,
      role: "ADMIN",
      employee: {
        create: {
          firstName: "Admin",
          lastName: "User",
          phone: "+1234567890",
          address: "123 Admin Street, HQ",
          department: "Management",
          designation: "System Administrator",
          joiningDate: new Date("2024-01-01"),
        },
      },
    },
    include: {
      employee: true,
    },
  });

  console.log("✅ Created Admin User:", adminUser.email);

  // Create Employee Users
  const employee1 = await prisma.user.create({
    data: {
      email: "john.doe@dayflow.com",
      password: hashedPassword,
      role: "EMPLOYEE",
      employee: {
        create: {
          firstName: "John",
          lastName: "Doe",
          phone: "+1234567891",
          address: "456 Employee Ave, City",
          department: "Engineering",
          designation: "Senior Software Engineer",
          joiningDate: new Date("2024-03-15"),
        },
      },
    },
    include: {
      employee: true,
    },
  });

  console.log("✅ Created Employee 1:", employee1.email);

  const employee2 = await prisma.user.create({
    data: {
      email: "jane.smith@dayflow.com",
      password: hashedPassword,
      role: "EMPLOYEE",
      employee: {
        create: {
          firstName: "Jane",
          lastName: "Smith",
          phone: "+1234567892",
          address: "789 Worker Blvd, Town",
          department: "Marketing",
          designation: "Marketing Manager",
          joiningDate: new Date("2024-06-01"),
        },
      },
    },
    include: {
      employee: true,
    },
  });

  console.log("✅ Created Employee 2:", employee2.email);

  const employee3 = await prisma.user.create({
    data: {
      email: "mike.johnson@dayflow.com",
      password: hashedPassword,
      role: "EMPLOYEE",
      employee: {
        create: {
          firstName: "Mike",
          lastName: "Johnson",
          phone: "+1234567893",
          address: "321 Staff Road, Village",
          department: "Sales",
          designation: "Sales Representative",
          joiningDate: new Date("2025-01-15"),
        },
      },
    },
    include: {
      employee: true,
    },
  });

  console.log("✅ Created Employee 3:", employee3.email);

  // Create sample attendance records (last 7 days for John Doe)
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const checkInTime = new Date(date);
    checkInTime.setHours(9, 0, 0, 0);

    const checkOutTime = new Date(date);
    checkOutTime.setHours(18, 0, 0, 0);

    await prisma.attendance.create({
      data: {
        employeeId: employee1.employee.id,
        date,
        checkInTime,
        checkOutTime: i === 0 ? null : checkOutTime,
        status: "PRESENT",
      },
    });
  }

  console.log("✅ Created 7 days of attendance for John Doe");

  // Create sample attendance for Jane
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const checkInTime = new Date(date);
    checkInTime.setHours(9, 30, 0, 0);

    const checkOutTime = new Date(date);
    checkOutTime.setHours(i === 2 ? 13 : 18, 0, 0, 0);

    await prisma.attendance.create({
      data: {
        employeeId: employee2.employee.id,
        date,
        checkInTime,
        checkOutTime: i === 0 ? null : checkOutTime,
        status: i === 2 ? "HALF_DAY" : "PRESENT",
      },
    });
  }

  console.log("✅ Created 5 days of attendance for Jane Smith");

  // Create sample leave request (PENDING)
  const futureDate1 = new Date();
  futureDate1.setDate(futureDate1.getDate() + 5);
  const futureEndDate1 = new Date(futureDate1);
  futureEndDate1.setDate(futureEndDate1.getDate() + 2);

  const pendingLeave = await prisma.leave.create({
    data: {
      employeeId: employee1.employee.id,
      leaveType: "SICK",
      startDate: futureDate1,
      endDate: futureEndDate1,
      reason: "Medical checkup and recovery",
      status: "PENDING",
    },
  });

  console.log("✅ Created pending leave request for John Doe");

  // Create approved leave request
  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 15);
  const futureEndDate2 = new Date(futureDate2);
  futureEndDate2.setDate(futureEndDate2.getDate() + 3);

  const approvedLeave = await prisma.leave.create({
    data: {
      employeeId: employee2.employee.id,
      leaveType: "PAID",
      startDate: futureDate2,
      endDate: futureEndDate2,
      reason: "Family vacation",
      status: "APPROVED",
    },
  });

  await prisma.leaveApproval.create({
    data: {
      leaveId: approvedLeave.id,
      approvedBy: adminUser.employee.id,
      comments: "Approved - enjoy your vacation",
    },
  });

  console.log("✅ Created approved leave request for Jane Smith");

  // Create sample payroll records
  await prisma.payroll.create({
    data: {
      employeeId: employee1.employee.id,
      month: new Date("2025-12-01"),
      baseSalary: 75000,
      allowances: 5000,
      deductions: 3000,
      netSalary: 77000,
      effectiveDate: new Date("2024-03-15"),
    },
  });

  await prisma.payroll.create({
    data: {
      employeeId: employee2.employee.id,
      month: new Date("2025-12-01"),
      baseSalary: 65000,
      allowances: 4000,
      deductions: 2500,
      netSalary: 66500,
      effectiveDate: new Date("2024-06-01"),
    },
  });

  await prisma.payroll.create({
    data: {
      employeeId: employee3.employee.id,
      month: new Date("2025-12-01"),
      baseSalary: 50000,
      allowances: 3000,
      deductions: 2000,
      netSalary: 51000,
      effectiveDate: new Date("2025-01-15"),
    },
  });

  console.log("✅ Created payroll records for December 2025");

  // Create sample audit log
  await prisma.auditLog.create({
    data: {
      action: "APPROVE",
      userId: adminUser.id,
      entityType: "Leave",
      entityId: approvedLeave.id,
      changes: JSON.stringify({
        previousStatus: "PENDING",
        newStatus: "APPROVED",
      }),
      reason: "Pre-approved vacation time",
    },
  });

  console.log("✅ Created sample audit log");

  console.log("\n🎉 Database seeded successfully!\n");
  console.log("📋 Demo Accounts:");
  console.log("┌─────────────────────────────────────────────────────┐");
  console.log("│ Admin Account                                       │");
  console.log("│ Email:    admin@dayflow.com                         │");
  console.log("│ Password: password123                               │");
  console.log("│ Role:     ADMIN                                     │");
  console.log("├─────────────────────────────────────────────────────┤");
  console.log("│ Employee Accounts                                   │");
  console.log("│ 1. john.doe@dayflow.com     (password123)           │");
  console.log("│ 2. jane.smith@dayflow.com   (password123)           │");
  console.log("│ 3. mike.johnson@dayflow.com (password123)           │");
  console.log("└─────────────────────────────────────────────────────┘\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

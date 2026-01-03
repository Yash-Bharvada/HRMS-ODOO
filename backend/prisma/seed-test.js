const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding test database...')

  // Clear existing data
  await prisma.auditLog.deleteMany()
  await prisma.leaveApproval.deleteMany()
  await prisma.leave.deleteMany()
  await prisma.payroll.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.user.deleteMany()

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'ADMIN',
      employee: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '+1234567890',
          department: 'Management',
          designation: 'System Administrator'
        }
      }
    },
    include: { employee: true }
  })

  const employee1 = await prisma.user.create({
    data: {
      email: 'john@test.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      employee: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567891',
          department: 'Engineering',
          designation: 'Software Developer'
        }
      }
    },
    include: { employee: true }
  })

  const employee2 = await prisma.user.create({
    data: {
      email: 'jane@test.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      employee: {
        create: {
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+1234567892',
          department: 'Marketing',
          designation: 'Marketing Manager'
        }
      }
    },
    include: { employee: true }
  })

  // Create test attendance records
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  await prisma.attendance.createMany({
    data: [
      {
        employeeId: employee1.employee.id,
        date: today,
        checkInTime: new Date(today.setHours(9, 0, 0, 0)),
        checkOutTime: new Date(today.setHours(17, 30, 0, 0)),
        status: 'PRESENT'
      },
      {
        employeeId: employee2.employee.id,
        date: yesterday,
        checkInTime: new Date(yesterday.setHours(9, 15, 0, 0)),
        checkOutTime: new Date(yesterday.setHours(17, 0, 0, 0)),
        status: 'PRESENT'
      }
    ]
  })

  // Create test leave requests
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7)
  const futureEndDate = new Date(futureDate)
  futureEndDate.setDate(futureEndDate.getDate() + 2)

  const leaveRequest = await prisma.leave.create({
    data: {
      employeeId: employee1.employee.id,
      leaveType: 'PAID',
      startDate: futureDate,
      endDate: futureEndDate,
      reason: 'Family vacation',
      status: 'PENDING'
    }
  })

  // Create test payroll records
  const currentMonth = new Date()
  currentMonth.setDate(1) // First day of current month

  await prisma.payroll.createMany({
    data: [
      {
        employeeId: employee1.employee.id,
        month: currentMonth,
        baseSalary: 75000,
        allowances: 5000,
        deductions: 2000,
        netSalary: 78000,
        effectiveDate: currentMonth
      },
      {
        employeeId: employee2.employee.id,
        month: currentMonth,
        baseSalary: 65000,
        allowances: 3000,
        deductions: 1500,
        netSalary: 66500,
        effectiveDate: currentMonth
      }
    ]
  })

  console.log('✅ Test database seeded successfully!')
  console.log(`👤 Admin user: admin@test.com / password123`)
  console.log(`👤 Employee 1: john@test.com / password123`)
  console.log(`👤 Employee 2: jane@test.com / password123`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
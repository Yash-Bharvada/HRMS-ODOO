const { execSync } = require('child_process')
const { PrismaClient } = require('@prisma/client')

// Test database setup and teardown utilities
class TestDatabaseManager {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    })
  }

  async setup() {
    console.log('🔧 Setting up test database...')
    
    try {
      // Push schema to test database
      execSync('npx prisma db push --force-reset', { 
        stdio: 'inherit',
        env: { 
          ...process.env, 
          DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL 
        }
      })

      // Seed test data
      execSync('node prisma/seed-test.js', { 
        stdio: 'inherit',
        env: { 
          ...process.env, 
          DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL 
        }
      })

      console.log('✅ Test database setup complete')
    } catch (error) {
      console.error('❌ Test database setup failed:', error)
      throw error
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test database...')
    
    try {
      // Clear all data but keep schema
      await this.prisma.auditLog.deleteMany()
      await this.prisma.leaveApproval.deleteMany()
      await this.prisma.leave.deleteMany()
      await this.prisma.payroll.deleteMany()
      await this.prisma.attendance.deleteMany()
      await this.prisma.refreshToken.deleteMany()
      await this.prisma.employee.deleteMany()
      await this.prisma.user.deleteMany()

      console.log('✅ Test database cleaned')
    } catch (error) {
      console.error('❌ Test database cleanup failed:', error)
      throw error
    }
  }

  async teardown() {
    console.log('🔥 Tearing down test database...')
    await this.prisma.$disconnect()
    console.log('✅ Test database connection closed')
  }

  async resetToSeedState() {
    await this.cleanup()
    
    // Re-run seed
    execSync('node prisma/seed-test.js', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL 
      }
    })
  }
}

module.exports = { TestDatabaseManager }
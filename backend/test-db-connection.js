const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/hrms_db'
    }
  }
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully');
    
    // Test if we can query (this will fail if tables don't exist, which is expected)
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Query test successful:', result);
    } catch (error) {
      console.log('ℹ️  Query test (expected to fail if no tables):', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
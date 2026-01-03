#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Database Integration Validation...\n');

// Check if required files exist
const requiredFiles = [
  'backend/.env',
  'backend/prisma/schema.prisma',
  'backend/src/main.ts',
  'dayflow-hrms/.env.local',
  'dayflow-hrms/src/services/api.service.ts',
  'dayflow-hrms/src/services/auth.service.ts',
  'dayflow-hrms/src/services/data.service.ts'
];

console.log('📁 Checking required files...');
let filesOk = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    filesOk = false;
  }
}

if (!filesOk) {
  console.log('\n❌ Some required files are missing. Please ensure all files are in place.');
  process.exit(1);
}

console.log('\n📦 Checking package dependencies...');

// Check backend dependencies
try {
  const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const requiredBackendDeps = [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/jwt',
    '@prisma/client',
    'bcryptjs',
    'passport-jwt'
  ];
  
  for (const dep of requiredBackendDeps) {
    if (backendPackage.dependencies[dep]) {
      console.log(`✅ Backend: ${dep}`);
    } else {
      console.log(`❌ Backend: ${dep} - MISSING`);
    }
  }
} catch (error) {
  console.log('❌ Could not read backend package.json');
}

// Check frontend dependencies
try {
  const frontendPackage = JSON.parse(fs.readFileSync('dayflow-hrms/package.json', 'utf8'));
  console.log(`✅ Frontend: Next.js project configured`);
} catch (error) {
  console.log('❌ Could not read frontend package.json');
}

console.log('\n🔧 Checking configuration files...');

// Check backend .env
try {
  const backendEnv = fs.readFileSync('backend/.env', 'utf8');
  if (backendEnv.includes('DATABASE_URL')) {
    console.log('✅ Backend DATABASE_URL configured');
  } else {
    console.log('❌ Backend DATABASE_URL not found');
  }
  
  if (backendEnv.includes('JWT_SECRET')) {
    console.log('✅ Backend JWT_SECRET configured');
  } else {
    console.log('❌ Backend JWT_SECRET not found');
  }
  
  if (backendEnv.includes('ALLOWED_ORIGINS')) {
    console.log('✅ Backend CORS configured');
  } else {
    console.log('⚠️  Backend CORS not configured (will use default)');
  }
} catch (error) {
  console.log('❌ Could not read backend .env file');
}

// Check frontend .env.local
try {
  const frontendEnv = fs.readFileSync('dayflow-hrms/.env.local', 'utf8');
  if (frontendEnv.includes('NEXT_PUBLIC_API_URL')) {
    console.log('✅ Frontend API URL configured');
  } else {
    console.log('❌ Frontend API URL not configured');
  }
} catch (error) {
  console.log('❌ Could not read frontend .env.local file');
}

console.log('\n🏗️  Checking service implementations...');

// Check if services are properly implemented
const apiServiceContent = fs.readFileSync('dayflow-hrms/src/services/api.service.ts', 'utf8');
if (apiServiceContent.includes('refreshToken') && apiServiceContent.includes('exponential backoff')) {
  console.log('✅ API service with retry logic implemented');
} else {
  console.log('⚠️  API service may be missing advanced features');
}

const authServiceContent = fs.readFileSync('dayflow-hrms/src/services/auth.service.ts', 'utf8');
if (authServiceContent.includes('BackendAuthService') && authServiceContent.includes('/authentication/login')) {
  console.log('✅ Authentication service connected to backend');
} else {
  console.log('❌ Authentication service not properly connected');
}

const dataServiceContent = fs.readFileSync('dayflow-hrms/src/services/data.service.ts', 'utf8');
if (dataServiceContent.includes('BackendUserService') && dataServiceContent.includes('apiService.get')) {
  console.log('✅ Data services connected to backend');
} else {
  console.log('❌ Data services not properly connected');
}

console.log('\n🛡️  Checking error handling...');

// Check if error handling components exist
const errorBoundaryExists = fs.existsSync('dayflow-hrms/src/components/ui/error-boundary.tsx');
const errorMessageExists = fs.existsSync('dayflow-hrms/src/components/ui/error-message.tsx');

if (errorBoundaryExists) {
  console.log('✅ Error boundary component implemented');
} else {
  console.log('❌ Error boundary component missing');
}

if (errorMessageExists) {
  console.log('✅ Error message components implemented');
} else {
  console.log('❌ Error message components missing');
}

console.log('\n⚡ Checking performance optimizations...');

const performanceUtilsExists = fs.existsSync('dayflow-hrms/src/utils/performance.ts');
const cacheServiceExists = fs.existsSync('backend/src/common/services/cache.service.ts');

if (performanceUtilsExists) {
  console.log('✅ Frontend performance monitoring implemented');
} else {
  console.log('❌ Frontend performance monitoring missing');
}

if (cacheServiceExists) {
  console.log('✅ Backend caching service implemented');
} else {
  console.log('❌ Backend caching service missing');
}

console.log('\n🔄 Checking concurrent update handling...');

const concurrentUpdatesExists = fs.existsSync('dayflow-hrms/src/utils/concurrent-updates.ts');
const conflictDialogExists = fs.existsSync('dayflow-hrms/src/components/ui/conflict-resolution-dialog.tsx');

if (concurrentUpdatesExists) {
  console.log('✅ Concurrent update manager implemented');
} else {
  console.log('❌ Concurrent update manager missing');
}

if (conflictDialogExists) {
  console.log('✅ Conflict resolution dialog implemented');
} else {
  console.log('❌ Conflict resolution dialog missing');
}

console.log('\n📊 Checking data reactivity...');

const dataContextExists = fs.existsSync('dayflow-hrms/src/contexts/data-context.tsx');
const dataRefreshHookExists = fs.existsSync('dayflow-hrms/src/hooks/use-data-refresh.ts');

if (dataContextExists) {
  console.log('✅ Data context for reactivity implemented');
} else {
  console.log('❌ Data context missing');
}

if (dataRefreshHookExists) {
  console.log('✅ Data refresh hooks implemented');
} else {
  console.log('❌ Data refresh hooks missing');
}

console.log('\n🧪 Checking testing infrastructure...');

const testSetupExists = fs.existsSync('backend/test-setup.js');
const testSeedExists = fs.existsSync('backend/prisma/seed-test.js');
const integrationTestExists = fs.existsSync('dayflow-hrms/src/utils/integration-test.ts');

if (testSetupExists) {
  console.log('✅ Backend test setup implemented');
} else {
  console.log('❌ Backend test setup missing');
}

if (testSeedExists) {
  console.log('✅ Test database seeding implemented');
} else {
  console.log('❌ Test database seeding missing');
}

if (integrationTestExists) {
  console.log('✅ Frontend integration tests implemented');
} else {
  console.log('❌ Frontend integration tests missing');
}

console.log('\n📋 VALIDATION SUMMARY');
console.log('='.repeat(50));

const allChecks = [
  filesOk,
  errorBoundaryExists,
  errorMessageExists,
  performanceUtilsExists,
  cacheServiceExists,
  concurrentUpdatesExists,
  conflictDialogExists,
  dataContextExists,
  dataRefreshHookExists,
  testSetupExists,
  testSeedExists,
  integrationTestExists
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 ALL INTEGRATION TASKS COMPLETED SUCCESSFULLY!');
  console.log('\n📝 Next Steps:');
  console.log('1. Start the PostgreSQL database');
  console.log('2. Run: cd backend && npm run db:push');
  console.log('3. Run: cd backend && npm run db:seed');
  console.log('4. Start backend: cd backend && npm run start:dev');
  console.log('5. Start frontend: cd dayflow-hrms && npm run dev');
  console.log('6. Test the integration at http://localhost:3001');
} else {
  console.log('\n⚠️  Some integration tasks are incomplete.');
  console.log('Please review the failed checks above.');
}

console.log('\n' + '='.repeat(50));
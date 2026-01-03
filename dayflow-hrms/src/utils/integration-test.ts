// Frontend integration testing utilities
import { apiService } from '@/services/api.service'
import { authService } from '@/services/auth.service'
import { userService, attendanceService, leaveService, payrollService } from '@/services/data.service'

interface TestResult {
  name: string
  success: boolean
  message: string
  duration: number
  error?: any
}

export class FrontendIntegrationTester {
  private results: TestResult[] = []

  async runAllTests(): Promise<TestResult[]> {
    this.results = []

    await this.testApiConnectivity()
    await this.testAuthenticationFlow()
    await this.testDataServices()
    await this.testErrorHandling()

    return this.results
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = performance.now()
    
    try {
      await testFn()
      const duration = performance.now() - startTime
      
      this.results.push({
        name,
        success: true,
        message: 'Test passed',
        duration
      })
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.results.push({
        name,
        success: false,
        message: error.message || 'Test failed',
        duration,
        error
      })
    }
  }

  private async testApiConnectivity(): Promise<void> {
    await this.runTest('API Connectivity', async () => {
      // Test basic API connectivity
      try {
        await apiService.get('/health')
      } catch (error) {
        // If health endpoint doesn't exist, try a different endpoint
        await apiService.get('/users')
      }
    })
  }

  private async testAuthenticationFlow(): Promise<void> {
    await this.runTest('Authentication Flow', async () => {
      // Test login with test credentials
      const testCredentials = {
        email: 'admin@test.com',
        password: 'password123'
      }

      const user = await authService.login(testCredentials)
      
      if (!user) {
        throw new Error('Login failed - no user returned')
      }

      if (!apiService.getToken()) {
        throw new Error('Login failed - no token stored')
      }

      // Test logout
      await authService.logout()
      
      if (apiService.getToken()) {
        throw new Error('Logout failed - token still present')
      }
    })
  }

  private async testDataServices(): Promise<void> {
    // Test user service
    await this.runTest('User Service', async () => {
      // Login first
      await authService.login({
        email: 'admin@test.com',
        password: 'password123'
      })

      const users = await userService.getAll()
      
      if (!Array.isArray(users)) {
        throw new Error('Users service did not return an array')
      }

      if (users.length === 0) {
        throw new Error('No users returned from service')
      }
    })

    // Test attendance service
    await this.runTest('Attendance Service', async () => {
      const attendance = await attendanceService.getAll()
      
      if (!Array.isArray(attendance)) {
        throw new Error('Attendance service did not return an array')
      }
    })

    // Test leave service
    await this.runTest('Leave Service', async () => {
      const leaves = await leaveService.getAll()
      
      if (!Array.isArray(leaves)) {
        throw new Error('Leave service did not return an array')
      }
    })

    // Test payroll service
    await this.runTest('Payroll Service', async () => {
      const payroll = await payrollService.getAll()
      
      if (!Array.isArray(payroll)) {
        throw new Error('Payroll service did not return an array')
      }
    })
  }

  private async testErrorHandling(): Promise<void> {
    await this.runTest('Error Handling', async () => {
      // Test invalid endpoint
      try {
        await apiService.get('/invalid-endpoint')
        throw new Error('Expected error for invalid endpoint')
      } catch (error) {
        if (error.message === 'Expected error for invalid endpoint') {
          throw error
        }
        // Expected error, test passed
      }

      // Test unauthorized request
      apiService.setToken(null) // Clear token
      
      try {
        await userService.getAll()
        throw new Error('Expected error for unauthorized request')
      } catch (error) {
        if (error.message === 'Expected error for unauthorized request') {
          throw error
        }
        // Expected error, test passed
      }
    })
  }

  getTestSummary(): {
    total: number
    passed: number
    failed: number
    totalDuration: number
    results: TestResult[]
  } {
    const passed = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => !r.success).length
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)

    return {
      total: this.results.length,
      passed,
      failed,
      totalDuration,
      results: this.results
    }
  }
}

export const integrationTester = new FrontendIntegrationTester()

// React hook for running integration tests
export function useIntegrationTest() {
  return {
    runTests: integrationTester.runAllTests.bind(integrationTester),
    getSummary: integrationTester.getTestSummary.bind(integrationTester)
  }
}
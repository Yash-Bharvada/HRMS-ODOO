/**
 * Property-Based Test for Dashboard Data Reactivity
 * **Feature: dayflow-hrms, Property 6: Dashboard data reactivity**
 * **Validates: Requirements 3.3, 4.5, 9.5**
 */

import React from 'react'
import * as fc from 'fast-check'
import { render, waitFor } from '@testing-library/react'
import { EmployeeDashboard } from '@/components/pages/employee-dashboard'
import { AuthProvider } from '@/contexts/auth-context'
import { User } from '@/types'

// Mock the auth service
jest.mock('@/services/auth.service', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    signup: jest.fn()
  }
}))

const { authService } = require('@/services/auth.service')

// Generators for property-based testing
const userArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  employeeId: fc.string({ minLength: 1, maxLength: 10 }),
  fullName: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  role: fc.constantFrom('employee' as const, 'admin' as const),
  phone: fc.option(fc.string()),
  address: fc.option(fc.string()),
  salary: fc.option(fc.integer({ min: 30000, max: 200000 })),
  createdAt: fc.date(),
  updatedAt: fc.date()
})

// Helper function to create a test wrapper with auth context
const createTestWrapper = (user: User | null) => {
  authService.getCurrentUser.mockReturnValue(user)
  
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(AuthProvider, null, children)
}

describe('Dashboard Data Reactivity Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display user information reactively based on authenticated user', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      async (user) => {
        const TestWrapper = createTestWrapper(user)
        
        const { container } = render(
          React.createElement(TestWrapper, null,
            React.createElement(EmployeeDashboard)
          )
        )

        // Wait for loading to complete
        await waitFor(() => {
          const content = container.textContent || ''
          expect(content).not.toContain('Loading dashboard...')
        }, { timeout: 8000 })

        const dashboardContent = container.textContent || ''
        
        // Property: Dashboard should always display user identity information
        expect(dashboardContent).toContain(user.fullName)
        expect(dashboardContent).toContain(user.employeeId)
        
        // Property: Dashboard should display role information
        const expectedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1)
        expect(dashboardContent).toContain(expectedRole)
        
        // Property: Salary display should be consistent with user data
        if (user.salary) {
          expect(dashboardContent).toContain(user.salary.toLocaleString())
        } else {
          expect(dashboardContent).toContain('N/A')
        }
      }
    ), { numRuns: 15 })
  }, 20000)

  it('should handle null user gracefully', async () => {
    const TestWrapper = createTestWrapper(null)
    
    const { container } = render(
      React.createElement(TestWrapper, null,
        React.createElement(EmployeeDashboard)
      )
    )

    // Wait for component to settle
    await waitFor(() => {
      const content = container.textContent || ''
      expect(content).not.toContain('Loading dashboard...')
    }, { timeout: 8000 })

    const dashboardContent = container.textContent || ''
    
    // Property: Dashboard should handle null user gracefully
    expect(dashboardContent).toContain('No user data available')
  }, 20000)

  it('should maintain consistent user display across multiple renders', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      async (user) => {
        const TestWrapper = createTestWrapper(user)
        
        // Render dashboard multiple times
        const renders = []
        for (let i = 0; i < 2; i++) {
          const { container } = render(
            React.createElement(TestWrapper, null,
              React.createElement(EmployeeDashboard)
            )
          )
          
          await waitFor(() => {
            const content = container.textContent || ''
            expect(content).not.toContain('Loading dashboard...')
          }, { timeout: 8000 })
          
          renders.push(container.textContent || '')
        }
        
        // Property: All renders should show consistent user information
        renders.forEach((render) => {
          expect(render).toContain(user.fullName)
          expect(render).toContain(user.employeeId)
        })
        
        // Property: User information should be deterministic
        const userInfoPattern = new RegExp(user.fullName)
        renders.forEach((render) => {
          expect(userInfoPattern.test(render)).toBe(true)
        })
      }
    ), { numRuns: 10 })
  }, 30000)

  it('should preserve dashboard state invariants under all user conditions', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      async (user) => {
        const TestWrapper = createTestWrapper(user)
        
        const { container } = render(
          React.createElement(TestWrapper, null,
            React.createElement(EmployeeDashboard)
          )
        )

        await waitFor(() => {
          const content = container.textContent || ''
          expect(content).not.toContain('Loading dashboard...')
        }, { timeout: 8000 })

        const dashboardContent = container.textContent || ''
        
        // Invariant 1: Dashboard should always display user identity
        expect(dashboardContent).toContain(user.fullName)
        expect(dashboardContent).toContain(user.employeeId)
        
        // Invariant 2: Dashboard should display welcome message
        expect(dashboardContent).toContain('Welcome back')
        
        // Invariant 3: Dashboard should have the four main cards
        expect(dashboardContent).toContain("Today's Status")
        expect(dashboardContent).toContain('Pending Leaves')
        expect(dashboardContent).toContain('Monthly Hours')
        expect(dashboardContent).toContain('Salary')
        
        // Invariant 4: Dashboard should have recent activity section
        expect(dashboardContent).toContain('Recent Activity')
        expect(dashboardContent).toContain('Check-in Time')
        expect(dashboardContent).toContain('Leave Status')
        
        // Invariant 5: Salary display should be consistent with user data
        if (user.salary) {
          expect(dashboardContent).toContain(user.salary.toLocaleString())
        } else {
          expect(dashboardContent).toContain('N/A')
        }
        
        // Invariant 6: Today's status should be one of the valid states
        const validStatuses = ['Present', 'Half Day', 'Absent', 'On Leave', 'Not checked in']
        const hasValidStatus = validStatuses.some(status => dashboardContent.includes(status))
        expect(hasValidStatus).toBe(true)
      }
    ), { numRuns: 15 })
  }, 25000)

  it('should display default values when no data is available', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      async (user) => {
        const TestWrapper = createTestWrapper(user)
        
        const { container } = render(
          React.createElement(TestWrapper, null,
            React.createElement(EmployeeDashboard)
          )
        )

        await waitFor(() => {
          const content = container.textContent || ''
          expect(content).not.toContain('Loading dashboard...')
        }, { timeout: 8000 })

        const dashboardContent = container.textContent || ''
        
        // Property: Dashboard should show default values for empty data
        expect(dashboardContent).toContain('0') // Default pending leaves count
        expect(dashboardContent).toContain('0h') // Default monthly hours
        expect(dashboardContent).toContain('Not checked in') // Default attendance status
        
        // Property: Dashboard should still be reactive to user data
        expect(dashboardContent).toContain(user.fullName)
        expect(dashboardContent).toContain(user.employeeId)
      }
    ), { numRuns: 15 })
  }, 20000)
})
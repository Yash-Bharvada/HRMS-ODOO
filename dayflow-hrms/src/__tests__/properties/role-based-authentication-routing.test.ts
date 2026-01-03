/**
 * Property-Based Test for Role-Based Authentication Routing
 * **Feature: dayflow-hrms, Property 1: Role-based authentication routing**
 * **Validates: Requirements 1.2, 1.4**
 */

import React from 'react'
import * as fc from 'fast-check'
import { render, screen, cleanup } from '@testing-library/react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AuthProvider } from '@/contexts/auth-context'
import { ToastProvider } from '@/components/ui/toast'
import { User } from '@/types'

// Mock the auth service to control authentication state
jest.mock('@/services/auth.service', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    signup: jest.fn()
  }
}))

// Mock the loading spinner component
jest.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => {
    return React.createElement('div', { 'data-testid': 'loading-spinner' }, `Loading... (${size})`)
  }
}))

const { authService } = require('@/services/auth.service')

// Generators for property-based testing
const userArbitrary = fc.record({
  id: fc.string({ minLength: 1 }),
  employeeId: fc.string({ minLength: 1 }),
  fullName: fc.string({ minLength: 1 }),
  email: fc.emailAddress(),
  role: fc.constantFrom('employee' as const, 'admin' as const),
  phone: fc.option(fc.string()),
  address: fc.option(fc.string()),
  salary: fc.option(fc.integer({ min: 30000, max: 200000 })),
  createdAt: fc.date(),
  updatedAt: fc.date()
})

const roleArbitrary = fc.constantFrom('employee' as const, 'admin' as const)

// Test wrapper component that provides all necessary contexts
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ToastProvider, null,
    React.createElement(AuthProvider, null, children)
  )
}

// Test component that we'll protect
const TestComponent = ({ role }: { role?: string }) => {
  return React.createElement('div', { 'data-testid': 'protected-content' }, 
    `Protected content for ${role || 'any'} role`
  )
}

describe('Role-Based Authentication Routing Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('should allow access when user role matches required role', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      roleArbitrary,
      async (user, requiredRole) => {
        // Set up user with the required role
        const userWithRole = { ...user, role: requiredRole }
        authService.getCurrentUser.mockReturnValue(userWithRole)

        render(
          React.createElement(TestWrapper, null,
            React.createElement(ProtectedRoute, { requiredRole },
              React.createElement(TestComponent, { role: requiredRole })
            )
          )
        )

        // Should show the protected content
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
        expect(screen.getByText(`Protected content for ${requiredRole} role`)).toBeInTheDocument()
        
        // Should not show access denied message
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
        expect(screen.queryByText('Insufficient Permissions')).not.toBeInTheDocument()

        cleanup()
      }
    ), { numRuns: 50 })
  })

  it('should deny access when user role does not match required role', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      roleArbitrary,
      roleArbitrary,
      async (user, userRole, requiredRole) => {
        // Skip test if roles are the same (covered by previous test)
        fc.pre(userRole !== requiredRole)

        // Set up user with different role than required
        const userWithRole = { ...user, role: userRole }
        authService.getCurrentUser.mockReturnValue(userWithRole)

        render(
          React.createElement(TestWrapper, null,
            React.createElement(ProtectedRoute, { requiredRole },
              React.createElement(TestComponent, { role: requiredRole })
            )
          )
        )

        // Should show insufficient permissions message
        expect(screen.getAllByText('Insufficient Permissions')[0]).toBeInTheDocument()
        expect(screen.getByText(`Required role: ${requiredRole}, Your role: ${userRole}`)).toBeInTheDocument()
        
        // Should not show the protected content
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()

        cleanup()
      }
    ), { numRuns: 50 })
  })

  it('should allow access when no specific role is required and user is authenticated', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      async (user) => {
        authService.getCurrentUser.mockReturnValue(user)

        render(
          React.createElement(TestWrapper, null,
            React.createElement(ProtectedRoute, null,
              React.createElement(TestComponent)
            )
          )
        )

        // Should show the protected content regardless of user role
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
        expect(screen.getByText('Protected content for any role')).toBeInTheDocument()
        
        // Should not show any access denied messages
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
        expect(screen.queryByText('Insufficient Permissions')).not.toBeInTheDocument()

        cleanup()
      }
    ), { numRuns: 50 })
  })

  it('should deny access when user is not authenticated', async () => {
    await fc.assert(fc.asyncProperty(
      fc.option(roleArbitrary),
      async (requiredRole) => {
        // Set up no authenticated user
        authService.getCurrentUser.mockReturnValue(null)

        render(
          React.createElement(TestWrapper, null,
            React.createElement(ProtectedRoute, { requiredRole },
              React.createElement(TestComponent, { role: requiredRole || 'any' })
            )
          )
        )

        // Should show access denied message
        expect(screen.getAllByText('Access Denied')[0]).toBeInTheDocument()
        expect(screen.getByText('Please log in to access this page.')).toBeInTheDocument()
        
        // Should not show the protected content
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()

        cleanup()
      }
    ), { numRuns: 50 })
  })

  it('should maintain consistent routing behavior across different user and role combinations', async () => {
    await fc.assert(fc.asyncProperty(
      fc.option(userArbitrary),
      fc.option(roleArbitrary),
      async (user, requiredRole) => {
        authService.getCurrentUser.mockReturnValue(user)

        render(
          React.createElement(TestWrapper, null,
            React.createElement(ProtectedRoute, { requiredRole },
              React.createElement(TestComponent, { role: requiredRole || 'any' })
            )
          )
        )

        const hasProtectedContent = screen.queryAllByTestId('protected-content').length > 0
        const hasAccessDenied = screen.queryAllByText('Access Denied').length > 0
        const hasInsufficientPermissions = screen.queryAllByText('Insufficient Permissions').length > 0

        // Exactly one of these should be true
        const stateCount = [hasProtectedContent, hasAccessDenied, hasInsufficientPermissions].filter(Boolean).length
        expect(stateCount).toBe(1)

        // Verify the logic is consistent
        if (!user) {
          // No user -> Access Denied
          expect(hasAccessDenied).toBe(true)
        } else if (requiredRole && user.role !== requiredRole) {
          // Wrong role -> Insufficient Permissions
          expect(hasInsufficientPermissions).toBe(true)
        } else {
          // Correct role or no role required -> Show content
          expect(hasProtectedContent).toBe(true)
        }

        cleanup()
      }
    ), { numRuns: 50 })
  })
})
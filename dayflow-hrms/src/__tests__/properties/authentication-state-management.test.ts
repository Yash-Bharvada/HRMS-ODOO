/**
 * Property-Based Test for Authentication State Management
 * **Feature: dayflow-hrms, Property 5: Authentication state management**
 * **Validates: Requirements 2.4**
 */

import React from 'react'
import * as fc from 'fast-check'
import { render, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { User, LoginCredentials } from '@/types'

// Mock the auth service to control authentication behavior
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

const loginCredentialsArbitrary = fc.record({
  email: fc.emailAddress(),
  password: fc.string({ minLength: 6 })
})

// Test component that uses the auth context
const TestAuthComponent = () => {
  const authState = useAuth()
  
  return React.createElement('div', { 
    'data-testid': 'auth-component',
    'data-user': authState.user ? authState.user.fullName : 'null',
    'data-authenticated': authState.isAuthenticated.toString(),
    'data-loading': authState.isLoading.toString()
  }, 
    `User: ${authState.user?.fullName || 'None'}, Loading: ${authState.isLoading}, Authenticated: ${authState.isAuthenticated}`
  )
}

describe('Authentication State Management Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should maintain consistent authentication state based on current user', () => {
    fc.assert(fc.property(
      fc.option(userArbitrary),
      (initialUser) => {
        // Set up initial user state
        authService.getCurrentUser.mockReturnValue(initialUser)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(TestAuthComponent)
          )
        )

        const authComponent = container.querySelector('[data-testid="auth-component"]')
        expect(authComponent).not.toBeNull()

        const isAuthenticated = authComponent?.getAttribute('data-authenticated') === 'true'
        const isLoading = authComponent?.getAttribute('data-loading') === 'true'
        const userName = authComponent?.getAttribute('data-user')

        // Verify initial state consistency
        expect(isAuthenticated).toBe(initialUser !== null)
        expect(isLoading).toBe(false)
        
        if (initialUser) {
          expect(userName).toBe(initialUser.fullName)
        } else {
          expect(userName).toBe('null')
        }

        // Verify state invariants
        if (isAuthenticated) {
          expect(userName).not.toBe('null')
        } else {
          expect(userName).toBe('null')
        }
      }
    ), { numRuns: 50 })
  })

  it('should handle successful login state transitions', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      loginCredentialsArbitrary,
      async (user, credentials) => {
        // Set up initial state (not authenticated)
        authService.getCurrentUser.mockReturnValue(null)
        authService.login.mockResolvedValue(user)

        let authContext: any = null
        const TestComponent = () => {
          authContext = useAuth()
          return React.createElement('div', { 'data-testid': 'test' }, 'test')
        }

        render(
          React.createElement(AuthProvider, null,
            React.createElement(TestComponent)
          )
        )

        // Initial state should be unauthenticated
        expect(authContext.isAuthenticated).toBe(false)
        expect(authContext.user).toBeNull()
        expect(authContext.isLoading).toBe(false)

        // Perform login
        await act(async () => {
          await authContext.login(credentials)
        })

        // Verify login state transition
        expect(authContext.isAuthenticated).toBe(true)
        expect(authContext.user).toEqual(user)
        expect(authContext.isLoading).toBe(false)

        // Verify that login was called with correct credentials
        expect(authService.login).toHaveBeenCalledWith(credentials)
      }
    ), { numRuns: 20 })
  })

  it('should handle logout state transitions correctly', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      async (user) => {
        // Set up initial state (authenticated)
        authService.getCurrentUser.mockReturnValue(user)
        authService.logout.mockResolvedValue(undefined)

        let authContext: any = null
        const TestComponent = () => {
          authContext = useAuth()
          return React.createElement('div', { 'data-testid': 'test' }, 'test')
        }

        render(
          React.createElement(AuthProvider, null,
            React.createElement(TestComponent)
          )
        )

        // Initial state should be authenticated
        expect(authContext.isAuthenticated).toBe(true)
        expect(authContext.user).toEqual(user)

        // Perform logout
        await act(async () => {
          await authContext.logout()
        })

        // Verify logout state transition
        expect(authContext.isAuthenticated).toBe(false)
        expect(authContext.user).toBeNull()
        expect(authContext.isLoading).toBe(false)

        // Verify that logout was called
        expect(authService.logout).toHaveBeenCalled()
      }
    ), { numRuns: 20 })
  })

  it('should handle authentication errors gracefully', async () => {
    await fc.assert(fc.asyncProperty(
      loginCredentialsArbitrary,
      fc.string({ minLength: 1 }),
      async (credentials, errorMessage) => {
        // Set up initial state
        authService.getCurrentUser.mockReturnValue(null)
        authService.login.mockRejectedValue(new Error(errorMessage))

        let authContext: any = null
        let capturedError: Error | null = null
        const TestComponent = () => {
          authContext = useAuth()
          return React.createElement('div', { 'data-testid': 'test' }, 'test')
        }

        render(
          React.createElement(AuthProvider, null,
            React.createElement(TestComponent)
          )
        )

        // Attempt login that will fail
        try {
          await act(async () => {
            await authContext.login(credentials)
          })
        } catch (error) {
          capturedError = error as Error
        }

        // Verify error was thrown
        expect(capturedError).not.toBeNull()
        expect(capturedError?.message).toBe(errorMessage)

        // Verify state remains unauthenticated after error
        expect(authContext.isAuthenticated).toBe(false)
        expect(authContext.user).toBeNull()
        expect(authContext.isLoading).toBe(false)
      }
    ), { numRuns: 20 })
  })

  it('should maintain state consistency across multiple context consumers', () => {
    fc.assert(fc.property(
      fc.option(userArbitrary),
      (user) => {
        // Set up initial user state
        authService.getCurrentUser.mockReturnValue(user)

        let consumer1State: any = null
        let consumer2State: any = null

        const Consumer1 = () => {
          consumer1State = useAuth()
          return React.createElement('div', { 'data-testid': 'consumer1' }, 'Consumer 1')
        }

        const Consumer2 = () => {
          consumer2State = useAuth()
          return React.createElement('div', { 'data-testid': 'consumer2' }, 'Consumer 2')
        }

        render(
          React.createElement(AuthProvider, null,
            React.createElement('div', null,
              React.createElement(Consumer1),
              React.createElement(Consumer2)
            )
          )
        )

        // Both consumers should have identical state
        expect(consumer1State).not.toBeNull()
        expect(consumer2State).not.toBeNull()
        expect(consumer1State.user).toEqual(consumer2State.user)
        expect(consumer1State.isAuthenticated).toBe(consumer2State.isAuthenticated)
        expect(consumer1State.isLoading).toBe(consumer2State.isLoading)

        // State should be consistent with expected values
        expect(consumer1State.user).toEqual(user)
        expect(consumer1State.isAuthenticated).toBe(user !== null)
      }
    ), { numRuns: 50 })
  })

  it('should preserve authentication state invariants under all conditions', () => {
    fc.assert(fc.property(
      fc.option(userArbitrary),
      (user) => {
        // Set up mock state
        authService.getCurrentUser.mockReturnValue(user)

        let capturedState: any = null
        const TestComponent = () => {
          capturedState = useAuth()
          return React.createElement('div', { 'data-testid': 'test' }, 'test')
        }

        render(
          React.createElement(AuthProvider, null,
            React.createElement(TestComponent)
          )
        )

        // Verify authentication state invariants
        expect(capturedState).not.toBeNull()

        // Invariant 1: isAuthenticated should be true if and only if user is not null
        expect(capturedState.isAuthenticated).toBe(capturedState.user !== null)

        // Invariant 2: user should be null if not authenticated
        if (!capturedState.isAuthenticated) {
          expect(capturedState.user).toBeNull()
        }

        // Invariant 3: user should not be null if authenticated
        if (capturedState.isAuthenticated) {
          expect(capturedState.user).not.toBeNull()
        }

        // Invariant 4: login and logout functions should always be available
        expect(typeof capturedState.login).toBe('function')
        expect(typeof capturedState.logout).toBe('function')

        // Invariant 5: isLoading should be a boolean
        expect(typeof capturedState.isLoading).toBe('boolean')
      }
    ), { numRuns: 50 })
  })

  it('should maintain authentication state consistency during context re-renders', () => {
    fc.assert(fc.property(
      userArbitrary,
      fc.string({ minLength: 1 }),
      (user, newName) => {
        // Set up initial user state
        authService.getCurrentUser.mockReturnValue(user)

        let firstRenderState: any = null
        let secondRenderState: any = null
        let renderCount = 0

        const TestComponent = ({ trigger }: { trigger: string }) => {
          renderCount++
          const authState = useAuth()
          
          if (renderCount === 1) {
            firstRenderState = { 
              user: authState.user,
              isAuthenticated: authState.isAuthenticated,
              isLoading: authState.isLoading
            }
          } else if (renderCount === 2) {
            secondRenderState = { 
              user: authState.user,
              isAuthenticated: authState.isAuthenticated,
              isLoading: authState.isLoading
            }
          }
          
          return React.createElement('div', { 'data-testid': 'test' }, `Render ${renderCount}: ${trigger}`)
        }

        const { rerender } = render(
          React.createElement(AuthProvider, null,
            React.createElement(TestComponent, { trigger: 'initial' })
          )
        )

        // Ensure first render captured state
        expect(firstRenderState).not.toBeNull()

        // Force re-render with different props
        rerender(
          React.createElement(AuthProvider, null,
            React.createElement(TestComponent, { trigger: newName })
          )
        )

        // Ensure second render captured state
        expect(secondRenderState).not.toBeNull()

        // Authentication state should remain consistent across re-renders
        // The key insight is that the AuthProvider is being re-created on rerender
        // which causes the context to reinitialize, so we should expect the same initial state
        expect(firstRenderState.user).toEqual(secondRenderState.user)
        expect(firstRenderState.isAuthenticated).toBe(secondRenderState.isAuthenticated)
        expect(firstRenderState.isLoading).toBe(secondRenderState.isLoading)
      }
    ), { numRuns: 30 })
  })
})
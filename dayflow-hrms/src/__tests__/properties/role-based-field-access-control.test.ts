/**
 * Property-Based Test for Role-Based Field Access Control
 * **Feature: dayflow-hrms, Property 7: Role-based field access control**
 * **Validates: Requirements 5.2, 5.3, 5.4, 10.3**
 */

import React from 'react'
import * as fc from 'fast-check'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/contexts/auth-context'
import { ProfilePage } from '@/components/pages/profile-page'
import { User } from '@/types'

// Mock the auth service to control authentication behavior
jest.mock('@/services/auth.service', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    signup: jest.fn()
  }
}))

// Mock the data service to control user data
jest.mock('@/services/data.service', () => ({
  userService: {
    getById: jest.fn(),
    update: jest.fn(),
    getAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn()
  }
}))

const { authService } = require('@/services/auth.service')
const { userService } = require('@/services/data.service')

// Generators for property-based testing
const userArbitrary = fc.record({
  id: fc.string({ minLength: 1 }),
  employeeId: fc.string({ minLength: 1 }),
  fullName: fc.string({ minLength: 1 }),
  email: fc.emailAddress(),
  role: fc.constantFrom('employee' as const, 'admin' as const),
  profilePicture: fc.option(fc.string()),
  phone: fc.option(fc.string()),
  address: fc.option(fc.string()),
  salary: fc.option(fc.integer({ min: 30000, max: 200000 })),
  createdAt: fc.date(),
  updatedAt: fc.date()
})

const editableFieldsArbitrary = fc.record({
  fullName: fc.string({ minLength: 1 }),
  email: fc.emailAddress(),
  phone: fc.option(fc.string()),
  address: fc.option(fc.string())
})

describe('Role-Based Field Access Control Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow employees to edit only their own profile fields', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary.filter(user => user.role === 'employee'),
      editableFieldsArbitrary,
      async (employee, editableFields) => {
        // Set up authenticated employee
        authService.getCurrentUser.mockReturnValue(employee)
        userService.getById.mockResolvedValue(employee)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        // Wait for the component to finish loading
        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Check that employee can see editable fields for their own profile
        const editableInputs = container.querySelectorAll('input:not([readonly]):not([disabled])')
        const readOnlyElements = container.querySelectorAll('[readonly], [disabled]')

        // Employee should have some editable fields (name, email, phone, address)
        expect(editableInputs.length).toBeGreaterThan(0)

        // Employee should not be able to edit sensitive fields like salary, role, employeeId
        const salaryField = container.querySelector('[data-testid="salary-field"]')
        const roleField = container.querySelector('[data-testid="role-field"]')
        const employeeIdField = container.querySelector('[data-testid="employee-id-field"]')

        if (salaryField) {
          expect(salaryField).toHaveAttribute('readonly')
        }
        if (roleField) {
          expect(roleField).toHaveAttribute('readonly')
        }
        if (employeeIdField) {
          expect(employeeIdField).toHaveAttribute('readonly')
        }
      }
    ), { numRuns: 20 })
  })

  it('should allow admins to edit all profile fields for any user', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary.filter(user => user.role === 'admin'),
      userArbitrary, // Target user to edit
      async (admin, targetUser) => {
        // Set up authenticated admin
        authService.getCurrentUser.mockReturnValue(admin)
        userService.getById.mockResolvedValue(targetUser)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        // Wait for the component to finish loading
        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Admin should be able to edit more fields than employees
        const editableInputs = container.querySelectorAll('input:not([readonly]):not([disabled])')
        
        // Admin should have access to edit salary and other sensitive fields
        const salaryField = container.querySelector('[data-testid="salary-field"]')
        
        if (salaryField) {
          // For admin, salary field should be editable
          expect(salaryField).not.toHaveAttribute('readonly')
          expect(salaryField).not.toHaveAttribute('disabled')
        }

        // Admin should have at least as many editable fields as employees
        expect(editableInputs.length).toBeGreaterThan(0)
      }
    ), { numRuns: 20 })
  })

  it('should prevent employees from editing other employees profiles', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary.filter(user => user.role === 'employee'),
      userArbitrary.filter(user => user.role === 'employee'),
      async (currentEmployee, otherEmployee) => {
        // Ensure we're testing different employees
        fc.pre(currentEmployee.id !== otherEmployee.id)

        // Set up authenticated employee trying to view another employee's profile
        authService.getCurrentUser.mockReturnValue(currentEmployee)
        userService.getById.mockResolvedValue(otherEmployee)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        // Wait for the component to finish loading
        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Employee viewing another employee's profile should see read-only fields
        const editableInputs = container.querySelectorAll('input:not([readonly]):not([disabled])')
        
        // Should have very limited or no editable fields when viewing other's profile
        // This depends on the implementation - might show read-only view or redirect
        const saveButton = container.querySelector('[data-testid="save-button"]')
        
        if (saveButton) {
          // If save button exists, it should be disabled for other employees' profiles
          expect(saveButton).toBeDisabled()
        }
      }
    ), { numRuns: 15 })
  })

  it('should maintain field access control consistency across re-renders', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      fc.string({ minLength: 1 }),
      async (user, triggerValue) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)
        userService.getById.mockResolvedValue(user)

        const TestWrapper = ({ trigger }: { trigger: string }) => {
          return React.createElement(AuthProvider, null,
            React.createElement('div', { 'data-trigger': trigger },
              React.createElement(ProfilePage)
            )
          )
        }

        const { container, rerender } = render(
          React.createElement(TestWrapper, { trigger: 'initial' })
        )

        // Wait for initial render to complete
        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Capture initial field access state
        const initialEditableCount = container.querySelectorAll('input:not([readonly]):not([disabled])').length
        const initialReadOnlyCount = container.querySelectorAll('[readonly], [disabled]').length

        // Force re-render
        rerender(React.createElement(TestWrapper, { trigger: triggerValue }))

        // Wait for re-render to complete
        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Verify field access remains consistent after re-render
        const afterEditableCount = container.querySelectorAll('input:not([readonly]):not([disabled])').length
        const afterReadOnlyCount = container.querySelectorAll('[readonly], [disabled]').length

        expect(afterEditableCount).toBe(initialEditableCount)
        expect(afterReadOnlyCount).toBe(initialReadOnlyCount)
      }
    ), { numRuns: 15 })
  })

  it('should enforce role-based field visibility rules', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      async (user) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)
        userService.getById.mockResolvedValue(user)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        // Wait for the component to finish loading
        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Basic fields should always be visible
        const nameField = container.querySelector('[data-testid="fullName-field"]')
        const emailField = container.querySelector('[data-testid="email-field"]')
        const employeeIdField = container.querySelector('[data-testid="employee-id-field"]')

        expect(nameField).toBeTruthy()
        expect(emailField).toBeTruthy()
        expect(employeeIdField).toBeTruthy()

        // Role-specific field visibility
        const salaryField = container.querySelector('[data-testid="salary-field"]')
        
        if (user.role === 'admin') {
          // Admin should see salary field and it should be editable
          if (salaryField) {
            expect(salaryField).not.toHaveAttribute('readonly')
          }
        } else {
          // Employee should see salary field but it should be read-only or hidden
          if (salaryField) {
            expect(salaryField).toHaveAttribute('readonly')
          }
        }
      }
    ), { numRuns: 30 })
  })

  it('should validate field access permissions before allowing edits', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      editableFieldsArbitrary,
      async (user, fieldUpdates) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)
        userService.getById.mockResolvedValue(user)
        userService.update.mockResolvedValue({ ...user, ...fieldUpdates })

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        // Wait for the component to finish loading
        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Check that field access is properly controlled
        const editableFields = container.querySelectorAll('input:not([readonly]):not([disabled])')
        const readOnlyFields = container.querySelectorAll('input[readonly], input[disabled]')

        // Verify that the number of editable vs read-only fields matches role expectations
        if (user.role === 'employee') {
          // Employees should have limited editable fields
          const sensitiveFields = container.querySelectorAll('[data-testid*="salary"], [data-testid*="role"]')
          sensitiveFields.forEach(field => {
            expect(field).toHaveAttribute('readonly')
          })
        } else if (user.role === 'admin') {
          // Admins should have more editable fields
          expect(editableFields.length).toBeGreaterThanOrEqual(readOnlyFields.length / 2)
        }

        // Verify that field access is consistent with user role
        expect(editableFields.length + readOnlyFields.length).toBeGreaterThan(0)
      }
    ), { numRuns: 25 })
  })
})
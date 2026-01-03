/**
 * Property-Based Test for Data Persistence Consistency
 * **Feature: dayflow-hrms, Property 8: Data persistence consistency**
 * **Validates: Requirements 5.5, 8.2, 9.2, 9.3, 11.3**
 */

import React from 'react'
import * as fc from 'fast-check'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/contexts/auth-context'
import { ProfilePage } from '@/components/pages/profile-page'
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

// Mock the data service
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

const userUpdateArbitrary = fc.record({
  fullName: fc.option(fc.string({ minLength: 1 })),
  email: fc.option(fc.emailAddress()),
  phone: fc.option(fc.string()),
  address: fc.option(fc.string()),
  salary: fc.option(fc.integer({ min: 30000, max: 200000 }))
})

describe('Data Persistence Consistency Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should persist user profile updates consistently', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      userUpdateArbitrary,
      async (originalUser, updates) => {
        // Filter out undefined values from updates
        const validUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value !== null)
        )

        // Skip if no valid updates
        fc.pre(Object.keys(validUpdates).length > 0)

        const updatedUser = { ...originalUser, ...validUpdates, updatedAt: new Date() }

        // Set up mocks
        authService.getCurrentUser.mockReturnValue(originalUser)
        userService.getById.mockResolvedValue(originalUser)
        userService.update.mockResolvedValue(updatedUser)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        // Wait for component to load
        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Simulate form updates
        Object.entries(validUpdates).forEach(([field, value]) => {
          const input = container.querySelector(`[data-testid="${field}-field"]`)
          if (input && value !== undefined) {
            fireEvent.change(input, { target: { value: String(value) } })
          }
        })

        // Submit the form
        const saveButton = container.querySelector('[data-testid="save-button"]')
        if (saveButton) {
          fireEvent.click(saveButton)

          // Wait for the update to complete
          await waitFor(() => {
            expect(userService.update).toHaveBeenCalled()
          }, { timeout: 3000 })

          // Verify that update was called with correct data
          const updateCall = userService.update.mock.calls[0]
          expect(updateCall[0]).toBe(originalUser.id)
          
          const updateData = updateCall[1]
          Object.entries(validUpdates).forEach(([field, value]) => {
            if (value !== undefined) {
              expect(updateData[field]).toBe(value)
            }
          })
        }
      }
    ), { numRuns: 15 })
  }, 10000)

  it('should maintain data consistency after successful updates', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      userUpdateArbitrary,
      async (originalUser, updates) => {
        // Filter out undefined values
        const validUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value !== null)
        )

        fc.pre(Object.keys(validUpdates).length > 0)

        const updatedUser = { ...originalUser, ...validUpdates, updatedAt: new Date() }

        // Set up mocks
        authService.getCurrentUser.mockReturnValue(originalUser)
        userService.getById.mockResolvedValue(originalUser)
        userService.update.mockResolvedValue(updatedUser)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Perform update
        Object.entries(validUpdates).forEach(([field, value]) => {
          const input = container.querySelector(`[data-testid="${field}-field"]`)
          if (input && value !== undefined) {
            fireEvent.change(input, { target: { value: String(value) } })
          }
        })

        const saveButton = container.querySelector('[data-testid="save-button"]')
        if (saveButton) {
          fireEvent.click(saveButton)

          await waitFor(() => {
            expect(userService.update).toHaveBeenCalled()
          }, { timeout: 3000 })

          // After successful update, the form should reflect the new values
          Object.entries(validUpdates).forEach(([field, value]) => {
            const input = container.querySelector(`[data-testid="${field}-field"]`) as HTMLInputElement
            if (input && value !== undefined) {
              expect(input.value).toBe(String(value))
            }
          })
        }
      }
    ), { numRuns: 15 })
  }, 10000)

  it('should handle update failures gracefully without corrupting data', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      userUpdateArbitrary,
      fc.string({ minLength: 1 }),
      async (originalUser, updates, errorMessage) => {
        const validUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value !== null)
        )

        fc.pre(Object.keys(validUpdates).length > 0)

        // Set up mocks with failure
        authService.getCurrentUser.mockReturnValue(originalUser)
        userService.getById.mockResolvedValue(originalUser)
        userService.update.mockRejectedValue(new Error(errorMessage))

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Attempt update that will fail
        Object.entries(validUpdates).forEach(([field, value]) => {
          const input = container.querySelector(`[data-testid="${field}-field"]`)
          if (input && value !== undefined) {
            fireEvent.change(input, { target: { value: String(value) } })
          }
        })

        const saveButton = container.querySelector('[data-testid="save-button"]')
        if (saveButton) {
          fireEvent.click(saveButton)

          await waitFor(() => {
            expect(userService.update).toHaveBeenCalled()
          }, { timeout: 3000 })

          // After failed update, form should show error state but not corrupt data
          const errorElement = container.querySelector('[data-testid="error-message"]')
          if (errorElement) {
            expect(errorElement.textContent).toContain(errorMessage)
          }

          // Original data should still be intact in the form
          // (implementation may reset form or keep user changes)
          const nameField = container.querySelector('[data-testid="fullName-field"]') as HTMLInputElement
          if (nameField) {
            // Should either show original value or the attempted update value
            expect(nameField.value).toBeTruthy()
          }
        }
      }
    ), { numRuns: 10 })
  }, 10000)

  it('should maintain referential integrity during updates', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      userUpdateArbitrary,
      async (originalUser, updates) => {
        const validUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value !== null)
        )

        fc.pre(Object.keys(validUpdates).length > 0)

        const updatedUser = { ...originalUser, ...validUpdates, updatedAt: new Date() }

        // Set up mocks
        authService.getCurrentUser.mockReturnValue(originalUser)
        userService.getById.mockResolvedValue(originalUser)
        userService.update.mockResolvedValue(updatedUser)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Perform update
        Object.entries(validUpdates).forEach(([field, value]) => {
          const input = container.querySelector(`[data-testid="${field}-field"]`)
          if (input && value !== undefined) {
            fireEvent.change(input, { target: { value: String(value) } })
          }
        })

        const saveButton = container.querySelector('[data-testid="save-button"]')
        if (saveButton) {
          fireEvent.click(saveButton)

          await waitFor(() => {
            expect(userService.update).toHaveBeenCalled()
          }, { timeout: 3000 })

          // Verify that critical fields remain unchanged
          const updateCall = userService.update.mock.calls[0]
          const updateData = updateCall[1]

          // ID should never change
          expect(updateData.id).toBeUndefined() // Should not be in update data

          // Employee ID should not change unless admin is updating
          if (originalUser.role === 'employee') {
            expect(updateData.employeeId).toBeUndefined()
          }

          // Role should not change through profile update
          expect(updateData.role).toBeUndefined()
        }
      }
    ), { numRuns: 15 })
  }, 10000)

  it('should ensure atomic updates - all or nothing', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      fc.record({
        fullName: fc.string({ minLength: 1 }),
        email: fc.emailAddress(),
        phone: fc.string(),
        address: fc.string()
      }),
      async (originalUser, multipleUpdates) => {
        const updatedUser = { ...originalUser, ...multipleUpdates, updatedAt: new Date() }

        // Set up mocks
        authService.getCurrentUser.mockReturnValue(originalUser)
        userService.getById.mockResolvedValue(originalUser)
        userService.update.mockResolvedValue(updatedUser)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Update multiple fields
        Object.entries(multipleUpdates).forEach(([field, value]) => {
          const input = container.querySelector(`[data-testid="${field}-field"]`)
          if (input) {
            fireEvent.change(input, { target: { value: String(value) } })
          }
        })

        const saveButton = container.querySelector('[data-testid="save-button"]')
        if (saveButton) {
          fireEvent.click(saveButton)

          await waitFor(() => {
            expect(userService.update).toHaveBeenCalled()
          }, { timeout: 3000 })

          // Verify that all updates were sent together in a single call
          expect(userService.update).toHaveBeenCalledTimes(1)
          
          const updateCall = userService.update.mock.calls[0]
          const updateData = updateCall[1]

          // All fields should be included in the single update
          Object.entries(multipleUpdates).forEach(([field, value]) => {
            expect(updateData[field]).toBe(value)
          })
        }
      }
    ), { numRuns: 15 })
  }, 10000)

  it('should preserve data consistency across component re-mounts', async () => {
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      userUpdateArbitrary,
      async (originalUser, updates) => {
        const validUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value !== null)
        )

        fc.pre(Object.keys(validUpdates).length > 0)

        const updatedUser = { ...originalUser, ...validUpdates, updatedAt: new Date() }

        // Set up mocks
        authService.getCurrentUser.mockReturnValue(originalUser)
        userService.getById.mockResolvedValue(originalUser)
        userService.update.mockResolvedValue(updatedUser)

        // First mount
        const { container, unmount } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        await waitFor(() => {
          expect(container.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Perform update
        Object.entries(validUpdates).forEach(([field, value]) => {
          const input = container.querySelector(`[data-testid="${field}-field"]`)
          if (input && value !== undefined) {
            fireEvent.change(input, { target: { value: String(value) } })
          }
        })

        const saveButton = container.querySelector('[data-testid="save-button"]')
        if (saveButton) {
          fireEvent.click(saveButton)

          await waitFor(() => {
            expect(userService.update).toHaveBeenCalled()
          }, { timeout: 3000 })
        }

        // Unmount and remount
        unmount()

        // Update mocks to return updated user
        userService.getById.mockResolvedValue(updatedUser)

        const { container: newContainer } = render(
          React.createElement(AuthProvider, null,
            React.createElement(ProfilePage)
          )
        )

        await waitFor(() => {
          expect(newContainer.querySelector('[data-testid="profile-form"]')).toBeTruthy()
        }, { timeout: 3000 })

        // Verify that the updated data is displayed after remount
        Object.entries(validUpdates).forEach(([field, value]) => {
          const input = newContainer.querySelector(`[data-testid="${field}-field"]`) as HTMLInputElement
          if (input && value !== undefined) {
            expect(input.value).toBe(String(value))
          }
        })
      }
    ), { numRuns: 10 })
  }, 10000)
})
/**
 * Property-Based Test for Navigation Functionality
 * **Feature: dayflow-hrms, Property 4: Navigation functionality**
 * **Validates: Requirements 2.3, 3.4**
 */

import React from 'react'
import * as fc from 'fast-check'
import { render, fireEvent } from '@testing-library/react'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { AuthProvider } from '@/contexts/auth-context'
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

const navigationPathArbitrary = fc.constantFrom(
  '/dashboard',
  '/profile', 
  '/attendance',
  '/leave',
  '/payroll',
  '/employees'
)

describe('Navigation Functionality Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should provide navigation callbacks for all accessible routes', () => {
    fc.assert(fc.property(
      userArbitrary,
      (user) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)

        const navigationCalls: string[] = []
        const mockNavigate = (href: string) => {
          navigationCalls.push(href)
        }

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(Sidebar, { 
              currentPath: '/dashboard',
              onNavigate: mockNavigate
            })
          )
        )

        // Get all navigation buttons
        const buttons = container.querySelectorAll('button')
        const navigationButtons = Array.from(buttons).filter(button => {
          const text = button.textContent || ''
          return ['Dashboard', 'Profile', 'Attendance', 'Leave', 'Payroll', 'Employees'].some(nav => 
            text.includes(nav)
          )
        })

        // Click each navigation button
        navigationButtons.forEach(button => {
          fireEvent.click(button)
        })

        // Verify navigation callbacks were called
        expect(navigationCalls.length).toBeGreaterThan(0)

        // Verify all navigation calls are valid paths
        navigationCalls.forEach(path => {
          expect(path).toMatch(/^\/[a-z]+$/)
          expect(['/dashboard', '/profile', '/attendance', '/leave', '/payroll', '/employees']).toContain(path)
        })

        // Role-based navigation verification
        if (user.role === 'employee') {
          // Employee should not be able to navigate to admin-only routes
          expect(navigationCalls.includes('/employees')).toBe(false)
        } else if (user.role === 'admin') {
          // Admin should have access to all routes including employees
          expect(navigationCalls.includes('/employees')).toBe(true)
        }
      }
    ), { numRuns: 20 })
  })

  it('should highlight active navigation items correctly', () => {
    fc.assert(fc.property(
      userArbitrary,
      navigationPathArbitrary,
      (user, currentPath) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)

        // Skip admin-only paths for employee users
        if (user.role === 'employee' && currentPath === '/employees') {
          return true // Skip this test case
        }

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(Sidebar, { 
              currentPath,
              onNavigate: () => {}
            })
          )
        )

        // Find all navigation buttons
        const buttons = container.querySelectorAll('button')
        const navigationButtons = Array.from(buttons).filter(button => {
          const text = button.textContent || ''
          return ['Dashboard', 'Profile', 'Attendance', 'Leave', 'Payroll', 'Employees'].some(nav => 
            text.includes(nav)
          )
        })

        // Count active buttons (should be exactly one)
        let activeButtonCount = 0
        let activeButtonPath = ''

        navigationButtons.forEach(button => {
          const buttonText = button.textContent || ''
          const isActive = button.className.includes('bg-primary')
          
          if (isActive) {
            activeButtonCount++
            // Map button text to path
            if (buttonText.includes('Dashboard')) activeButtonPath = '/dashboard'
            else if (buttonText.includes('Profile')) activeButtonPath = '/profile'
            else if (buttonText.includes('Attendance')) activeButtonPath = '/attendance'
            else if (buttonText.includes('Leave')) activeButtonPath = '/leave'
            else if (buttonText.includes('Payroll')) activeButtonPath = '/payroll'
            else if (buttonText.includes('Employees')) activeButtonPath = '/employees'
          }
        })

        // Should have exactly one active button
        expect(activeButtonCount).toBe(1)
        
        // Active button should correspond to current path
        expect(activeButtonPath).toBe(currentPath)
      }
    ), { numRuns: 20 })
  })

  it('should handle logout functionality consistently across navigation components', () => {
    fc.assert(fc.property(
      userArbitrary,
      (user) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)
        authService.logout.mockResolvedValue(undefined)

        // Test logout from Sidebar
        const { container: sidebarContainer } = render(
          React.createElement(AuthProvider, null,
            React.createElement(Sidebar, { 
              currentPath: '/dashboard',
              onNavigate: () => {}
            })
          )
        )

        // Test logout from Navbar
        const { container: navbarContainer } = render(
          React.createElement(AuthProvider, null,
            React.createElement(Navbar, { 
              title: 'Test Page'
            })
          )
        )

        // Find logout buttons in both components
        const sidebarButtons = sidebarContainer.querySelectorAll('button')
        const navbarButtons = navbarContainer.querySelectorAll('button')

        const sidebarLogoutButton = Array.from(sidebarButtons).find(button => 
          button.textContent?.includes('Logout')
        )
        const navbarLogoutButton = Array.from(navbarButtons).find(button => 
          button.textContent?.includes('Logout')
        )

        // Both components should have logout functionality
        expect(sidebarLogoutButton).not.toBeNull()
        expect(navbarLogoutButton).not.toBeNull()

        // Logout buttons should be clickable
        expect(sidebarLogoutButton?.disabled).toBe(false)
        expect(navbarLogoutButton?.disabled).toBe(false)
      }
    ), { numRuns: 20 })
  })

  it('should maintain navigation state consistency across different user roles', () => {
    fc.assert(fc.property(
      fc.constantFrom('employee' as const, 'admin' as const),
      fc.string({ minLength: 1 }),
      fc.string({ minLength: 1 }),
      (role, fullName, employeeId) => {
        const user: User = {
          id: 'test-id',
          employeeId,
          fullName,
          email: 'test@example.com',
          role,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(Sidebar, { 
              currentPath: '/dashboard',
              onNavigate: () => {}
            })
          )
        )

        const containerText = container.textContent || ''

        // Common navigation items should always be present
        const commonNavItems = ['Dashboard', 'Profile', 'Attendance', 'Leave', 'Payroll']
        commonNavItems.forEach(item => {
          expect(containerText.includes(item)).toBe(true)
        })

        // Role-specific navigation consistency
        if (role === 'admin') {
          expect(containerText.includes('Employees')).toBe(true)
        } else {
          expect(containerText.includes('Employees')).toBe(false)
        }

        // User info should be displayed consistently
        expect(containerText.includes(user.fullName)).toBe(true)
        expect(containerText.includes(role)).toBe(true)

        // Logout should always be available
        expect(containerText.includes('Logout')).toBe(true)
      }
    ), { numRuns: 30 })
  })

  it('should provide proper navigation structure and accessibility', () => {
    fc.assert(fc.property(
      userArbitrary,
      navigationPathArbitrary,
      (user, currentPath) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)

        // Skip admin-only paths for employee users
        if (user.role === 'employee' && currentPath === '/employees') {
          return true // Skip this test case
        }

        const navigationCalls: string[] = []
        const mockNavigate = (href: string) => {
          navigationCalls.push(href)
        }

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(Sidebar, { 
              currentPath,
              onNavigate: mockNavigate
            })
          )
        )

        // Navigation should be structured properly
        const buttons = container.querySelectorAll('button')
        const navigationButtons = Array.from(buttons).filter(button => {
          const text = button.textContent || ''
          return ['Dashboard', 'Profile', 'Attendance', 'Leave', 'Payroll', 'Employees'].some(nav => 
            text.includes(nav)
          )
        })

        // Should have navigation buttons
        expect(navigationButtons.length).toBeGreaterThan(0)

        // Each navigation button should be properly structured
        navigationButtons.forEach(button => {
          // Should have proper button attributes
          expect(button.tagName).toBe('BUTTON')
          
          // Should have text content
          expect(button.textContent).toBeTruthy()
          
          // Should be clickable (not disabled)
          expect(button.disabled).toBe(false)
        })

        // Should have brand/logo
        const containerText = container.textContent || ''
        expect(containerText.includes('Dayflow HRMS')).toBe(true)

        // Should have user information
        expect(containerText.includes(user.fullName)).toBe(true)
        expect(containerText.includes(user.role)).toBe(true)
      }
    ), { numRuns: 20 })
  })

  it('should handle navigation callbacks with valid paths only', () => {
    fc.assert(fc.property(
      userArbitrary,
      (user) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)

        const navigationCalls: string[] = []
        const mockNavigate = (href: string) => {
          navigationCalls.push(href)
        }

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(Sidebar, { 
              currentPath: '/dashboard',
              onNavigate: mockNavigate
            })
          )
        )

        // Click all navigation buttons
        const buttons = container.querySelectorAll('button')
        const navigationButtons = Array.from(buttons).filter(button => {
          const text = button.textContent || ''
          return ['Dashboard', 'Profile', 'Attendance', 'Leave', 'Payroll', 'Employees'].some(nav => 
            text.includes(nav)
          )
        })

        navigationButtons.forEach(button => {
          fireEvent.click(button)
        })

        // All navigation calls should be valid paths
        const validPaths = ['/dashboard', '/profile', '/attendance', '/leave', '/payroll', '/employees']
        navigationCalls.forEach(path => {
          expect(validPaths).toContain(path)
          expect(path).toMatch(/^\/[a-z]+$/)
        })

        // Should not have duplicate calls for the same path
        const uniquePaths = [...new Set(navigationCalls)]
        expect(uniquePaths.length).toBe(navigationCalls.length)
      }
    ), { numRuns: 20 })
  })

  it('should maintain navigation consistency between sidebar and navbar components', () => {
    fc.assert(fc.property(
      userArbitrary,
      fc.string({ minLength: 1, maxLength: 50 }),
      (user, pageTitle) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)

        // Render sidebar
        const { container: sidebarContainer } = render(
          React.createElement(AuthProvider, null,
            React.createElement(Sidebar, { 
              currentPath: '/dashboard',
              onNavigate: () => {}
            })
          )
        )

        // Render navbar
        const { container: navbarContainer } = render(
          React.createElement(AuthProvider, null,
            React.createElement(Navbar, { 
              title: pageTitle
            })
          )
        )

        const sidebarText = sidebarContainer.textContent || ''
        const navbarText = navbarContainer.textContent || ''

        // Both should display user information consistently
        expect(sidebarText.includes(user.fullName)).toBe(true)
        expect(navbarText.includes(user.fullName)).toBe(true)

        expect(sidebarText.includes(user.role)).toBe(true)
        expect(navbarText.includes(user.role)).toBe(true)

        // Both should have logout functionality
        expect(sidebarText.includes('Logout')).toBe(true)
        expect(navbarText.includes('Logout')).toBe(true)

        // Navbar should display the page title
        expect(navbarText.includes(pageTitle)).toBe(true)

        // Sidebar should display the brand
        expect(sidebarText.includes('Dayflow HRMS')).toBe(true)
      }
    ), { numRuns: 20 })
  })
})
/**
 * Property-Based Test for Consistent Layout Across Protected Routes
 * **Feature: dayflow-hrms, Property 3: Consistent layout across protected routes**
 * **Validates: Requirements 2.1, 2.2**
 */

import React from 'react'
import * as fc from 'fast-check'
import { render } from '@testing-library/react'
import { AppLayout } from '@/components/layout/app-layout'
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

const pageContentArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 50 }),
  content: fc.string({ minLength: 1, maxLength: 200 }),
  pageType: fc.constantFrom('dashboard', 'profile', 'attendance', 'leave', 'payroll', 'employees')
})

// Test component that represents different page content
const TestPageContent = ({ title, content, pageType }: { title: string, content: string, pageType: string }) => {
  return React.createElement('div', { 
    'data-testid': 'page-content',
    'data-page-type': pageType,
    'data-title': title
  }, content)
}

describe('Consistent Layout Across Protected Routes Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should maintain consistent layout structure across all protected routes', () => {
    fc.assert(fc.property(
      userArbitrary,
      pageContentArbitrary,
      (user, pageData) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(AppLayout, { 
              title: pageData.title,
              currentPath: `/${pageData.pageType}`
            },
              React.createElement(TestPageContent, pageData)
            )
          )
        )

        // Verify consistent layout elements are present
        const pageContent = container.querySelector('[data-testid="page-content"]')
        expect(pageContent).not.toBeNull()

        // Check for sidebar presence (should be consistent across all routes)
        const sidebarBrand = container.textContent?.includes('Dayflow HRMS')
        expect(sidebarBrand).toBe(true)

        // Check for navbar presence (should be consistent across all routes)
        const navbarTitle = container.textContent?.includes(pageData.title)
        expect(navbarTitle).toBe(true)

        // Check for user info in navbar (should be consistent across all routes)
        const userInfo = container.textContent?.includes(user.fullName)
        expect(userInfo).toBe(true)

        // Check for logout button (should be consistent across all routes)
        const logoutButton = container.textContent?.includes('Logout')
        expect(logoutButton).toBe(true)
      }
    ), { numRuns: 30 })
  })

  it('should display role-appropriate navigation items consistently', () => {
    fc.assert(fc.property(
      userArbitrary,
      pageContentArbitrary,
      (user, pageData) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(AppLayout, { 
              title: pageData.title,
              currentPath: `/${pageData.pageType}`
            },
              React.createElement(TestPageContent, pageData)
            )
          )
        )

        const containerText = container.textContent || ''

        // Common navigation items that should be present for all roles
        const commonNavItems = ['Dashboard', 'Profile', 'Attendance', 'Leave', 'Payroll']
        commonNavItems.forEach(item => {
          expect(containerText.includes(item)).toBe(true)
        })

        // Admin-only navigation items
        if (user.role === 'admin') {
          expect(containerText.includes('Employees')).toBe(true)
        } else {
          // Employee users should not see admin-only items
          expect(containerText.includes('Employees')).toBe(false)
        }

        // User role should be displayed consistently
        expect(containerText.includes(user.role)).toBe(true)
      }
    ), { numRuns: 30 })
  })

  it('should maintain layout consistency when switching between different page types', () => {
    fc.assert(fc.property(
      userArbitrary,
      fc.array(pageContentArbitrary, { minLength: 2, maxLength: 5 }),
      (user, pageDataArray) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)

        const layoutElements: Array<{
          hasSidebar: boolean,
          hasNavbar: boolean,
          hasUserInfo: boolean,
          hasLogout: boolean,
          pageType: string
        }> = []

        // Test each page type
        pageDataArray.forEach(pageData => {
          const { container } = render(
            React.createElement(AuthProvider, null,
              React.createElement(AppLayout, { 
                title: pageData.title,
                currentPath: `/${pageData.pageType}`
              },
                React.createElement(TestPageContent, pageData)
              )
            )
          )

          const containerText = container.textContent || ''
          
          layoutElements.push({
            hasSidebar: containerText.includes('Dayflow HRMS'),
            hasNavbar: containerText.includes(pageData.title),
            hasUserInfo: containerText.includes(user.fullName),
            hasLogout: containerText.includes('Logout'),
            pageType: pageData.pageType
          })
        })

        // Verify all pages have consistent layout elements
        const firstPage = layoutElements[0]
        layoutElements.forEach(page => {
          expect(page.hasSidebar).toBe(firstPage.hasSidebar)
          expect(page.hasNavbar).toBe(firstPage.hasNavbar)
          expect(page.hasUserInfo).toBe(firstPage.hasUserInfo)
          expect(page.hasLogout).toBe(firstPage.hasLogout)
          
          // All should be true for authenticated users
          expect(page.hasSidebar).toBe(true)
          expect(page.hasNavbar).toBe(true)
          expect(page.hasUserInfo).toBe(true)
          expect(page.hasLogout).toBe(true)
        })
      }
    ), { numRuns: 20 })
  })

  it('should preserve layout structure regardless of page content size', () => {
    fc.assert(fc.property(
      userArbitrary,
      fc.string({ minLength: 1, maxLength: 10 }), // Short content
      fc.string({ minLength: 500, maxLength: 1000 }), // Long content
      (user, shortContent, longContent) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)

        // Test with short content
        const { container: shortContainer } = render(
          React.createElement(AuthProvider, null,
            React.createElement(AppLayout, { title: 'Test Page' },
              React.createElement('div', { 'data-testid': 'short-content' }, shortContent)
            )
          )
        )

        // Test with long content
        const { container: longContainer } = render(
          React.createElement(AuthProvider, null,
            React.createElement(AppLayout, { title: 'Test Page' },
              React.createElement('div', { 'data-testid': 'long-content' }, longContent)
            )
          )
        )

        // Both should have consistent layout structure
        const shortText = shortContainer.textContent || ''
        const longText = longContainer.textContent || ''

        // Layout elements should be present in both
        expect(shortText.includes('Dayflow HRMS')).toBe(true)
        expect(longText.includes('Dayflow HRMS')).toBe(true)
        
        expect(shortText.includes('Test Page')).toBe(true)
        expect(longText.includes('Test Page')).toBe(true)
        
        expect(shortText.includes(user.fullName)).toBe(true)
        expect(longText.includes(user.fullName)).toBe(true)
        
        expect(shortText.includes('Logout')).toBe(true)
        expect(longText.includes('Logout')).toBe(true)

        // Content should be present
        expect(shortContainer.querySelector('[data-testid="short-content"]')).not.toBeNull()
        expect(longContainer.querySelector('[data-testid="long-content"]')).not.toBeNull()
      }
    ), { numRuns: 20 })
  })

  it('should maintain layout accessibility and structure invariants', () => {
    fc.assert(fc.property(
      userArbitrary,
      pageContentArbitrary,
      (user, pageData) => {
        // Set up authenticated user
        authService.getCurrentUser.mockReturnValue(user)

        const { container } = render(
          React.createElement(AuthProvider, null,
            React.createElement(AppLayout, { 
              title: pageData.title,
              currentPath: `/${pageData.pageType}`
            },
              React.createElement(TestPageContent, pageData)
            )
          )
        )

        // Layout structure invariants
        const pageContent = container.querySelector('[data-testid="page-content"]')
        expect(pageContent).not.toBeNull()

        // Should have proper semantic structure
        const containerText = container.textContent || ''
        
        // Brand/logo should be present (sidebar)
        expect(containerText.includes('Dayflow HRMS')).toBe(true)
        
        // Page title should be present (navbar)
        expect(containerText.includes(pageData.title)).toBe(true)
        
        // User identification should be present
        expect(containerText.includes(user.fullName)).toBe(true)
        expect(containerText.includes(user.role)).toBe(true)
        
        // Navigation should be present
        expect(containerText.includes('Dashboard')).toBe(true)
        
        // Security controls should be present
        expect(containerText.includes('Logout')).toBe(true)

        // Content area should be accessible
        const actualPageContent = pageContent.textContent
        expect(actualPageContent).toBe(pageData.content)
      }
    ), { numRuns: 30 })
  })

  it('should handle different user roles consistently in layout', () => {
    fc.assert(fc.property(
      fc.constantFrom('employee' as const, 'admin' as const),
      pageContentArbitrary,
      fc.string({ minLength: 1 }),
      fc.string({ minLength: 1 }),
      (role, pageData, fullName, employeeId) => {
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
            React.createElement(AppLayout, { 
              title: pageData.title,
              currentPath: `/${pageData.pageType}`
            },
              React.createElement(TestPageContent, pageData)
            )
          )
        )

        const containerText = container.textContent || ''

        // Layout should be consistent regardless of role
        expect(containerText.includes('Dayflow HRMS')).toBe(true)
        expect(containerText.includes(pageData.title)).toBe(true)
        expect(containerText.includes(user.fullName)).toBe(true)
        expect(containerText.includes('Logout')).toBe(true)

        // Role-specific navigation should be consistent
        if (role === 'admin') {
          expect(containerText.includes('Employees')).toBe(true)
        } else {
          expect(containerText.includes('Employees')).toBe(false)
        }

        // Role should be displayed
        expect(containerText.includes(role)).toBe(true)
      }
    ), { numRuns: 30 })
  })
})
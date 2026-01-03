/**
 * Property-Based Tests for Leave Request Workflow
 * **Feature: dayflow-hrms, Property 12: Leave request workflow**
 * **Validates: Requirements 8.2, 8.4**
 */

import * as fc from 'fast-check'
import { LeaveRequest } from '@/types'
import { leaveService } from '@/services/data.service'

// Arbitraries for generating test data
const employeeIdArbitrary = fc.string({ minLength: 1, maxLength: 10 })

const leaveTypeArbitrary = fc.oneof(
  fc.constant('paid' as const),
  fc.constant('sick' as const),
  fc.constant('unpaid' as const)
)

const futureDateArbitrary = fc.date({
  min: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // One year from now
})

const reasonArbitrary = fc.string({ minLength: 10, maxLength: 200 })

const leaveRequestDataArbitrary = fc.record({
  employeeId: employeeIdArbitrary,
  type: leaveTypeArbitrary,
  fromDate: futureDateArbitrary,
  toDate: futureDateArbitrary,
  reason: reasonArbitrary
}).filter(data => data.fromDate <= data.toDate)

describe('Leave Request Workflow Properties', () => {
  beforeEach(() => {
    // Clear any existing leave requests
    const mockLeaveRequests = require('@/services/mock-data').mockLeaveRequests
    mockLeaveRequests.length = 0
  })

  it('should create leave requests with pending status by default', async () => {
    await fc.assert(fc.asyncProperty(
      leaveRequestDataArbitrary,
      async (requestData) => {
        // Create a leave request
        const createdRequest = await leaveService.create(requestData)

        // Verify the request was created with pending status
        expect(createdRequest.status).toBe('pending')
        expect(createdRequest.employeeId).toBe(requestData.employeeId)
        expect(createdRequest.type).toBe(requestData.type)
        expect(createdRequest.reason).toBe(requestData.reason)
        expect(createdRequest.id).toBeDefined()
        expect(createdRequest.createdAt).toBeInstanceOf(Date)
        expect(createdRequest.updatedAt).toBeInstanceOf(Date)
      }
    ), { numRuns: 5 })
  }, 10000)

  it('should allow admin to approve pending requests', async () => {
    await fc.assert(fc.asyncProperty(
      leaveRequestDataArbitrary,
      fc.option(fc.string({ minLength: 1, maxLength: 100 })), // Optional admin comment
      async (requestData, adminComment) => {
        // Create a leave request
        const createdRequest = await leaveService.create(requestData)
        expect(createdRequest.status).toBe('pending')

        // Approve the request
        const approvedRequest = await (leaveService as any).approveRequest(
          createdRequest.id, 
          adminComment || undefined
        )

        // Verify the request was approved
        expect(approvedRequest.status).toBe('approved')
        expect(approvedRequest.id).toBe(createdRequest.id)
        expect(approvedRequest.employeeId).toBe(requestData.employeeId)
        
        if (adminComment) {
          expect(approvedRequest.adminComment).toBe(adminComment)
        }

        // Verify the request can be retrieved with approved status
        const retrievedRequest = await leaveService.getById(createdRequest.id)
        expect(retrievedRequest.status).toBe('approved')
      }
    ), { numRuns: 5 })
  }, 10000)

  it('should allow admin to reject pending requests', async () => {
    await fc.assert(fc.asyncProperty(
      leaveRequestDataArbitrary,
      fc.option(fc.string({ minLength: 1, maxLength: 100 })), // Optional admin comment
      async (requestData, adminComment) => {
        // Create a leave request
        const createdRequest = await leaveService.create(requestData)
        expect(createdRequest.status).toBe('pending')

        // Reject the request
        const rejectedRequest = await (leaveService as any).rejectRequest(
          createdRequest.id, 
          adminComment || undefined
        )

        // Verify the request was rejected
        expect(rejectedRequest.status).toBe('rejected')
        expect(rejectedRequest.id).toBe(createdRequest.id)
        expect(rejectedRequest.employeeId).toBe(requestData.employeeId)
        
        if (adminComment) {
          expect(rejectedRequest.adminComment).toBe(adminComment)
        }

        // Verify the request can be retrieved with rejected status
        const retrievedRequest = await leaveService.getById(createdRequest.id)
        expect(retrievedRequest.status).toBe('rejected')
      }
    ), { numRuns: 5 })
  }, 10000)

  it('should maintain request data integrity throughout workflow', async () => {
    await fc.assert(fc.asyncProperty(
      leaveRequestDataArbitrary,
      async (requestData) => {
        // Create a leave request
        const createdRequest = await leaveService.create(requestData)

        // Verify all original data is preserved
        expect(createdRequest.employeeId).toBe(requestData.employeeId)
        expect(createdRequest.type).toBe(requestData.type)
        expect(createdRequest.reason).toBe(requestData.reason)
        expect(new Date(createdRequest.fromDate).getTime()).toBe(requestData.fromDate.getTime())
        expect(new Date(createdRequest.toDate).getTime()).toBe(requestData.toDate.getTime())

        // Approve the request
        const approvedRequest = await (leaveService as any).approveRequest(createdRequest.id)

        // Verify data integrity is maintained after approval
        expect(approvedRequest.employeeId).toBe(requestData.employeeId)
        expect(approvedRequest.type).toBe(requestData.type)
        expect(approvedRequest.reason).toBe(requestData.reason)
        expect(new Date(approvedRequest.fromDate).getTime()).toBe(requestData.fromDate.getTime())
        expect(new Date(approvedRequest.toDate).getTime()).toBe(requestData.toDate.getTime())
        expect(approvedRequest.status).toBe('approved')
      }
    ), { numRuns: 5 })
  }, 10000)

  it('should filter requests by employee correctly', async () => {
    await fc.assert(fc.asyncProperty(
      fc.array(leaveRequestDataArbitrary, { minLength: 1, maxLength: 3 }),
      async (requestsData) => {
        // Create multiple requests for different employees
        const createdRequests = await Promise.all(
          requestsData.map(data => leaveService.create(data))
        )

        // Get unique employee IDs
        const employeeIds = [...new Set(requestsData.map(r => r.employeeId))]

        // For each employee, verify filtering works correctly
        for (const employeeId of employeeIds) {
          const employeeRequests = await (leaveService as any).getByEmployeeId(employeeId)
          
          // All returned requests should belong to this employee
          employeeRequests.forEach((request: LeaveRequest) => {
            expect(request.employeeId).toBe(employeeId)
          })

          // Count should match expected
          const expectedCount = requestsData.filter(r => r.employeeId === employeeId).length
          expect(employeeRequests.length).toBe(expectedCount)
        }
      }
    ), { numRuns: 3 })
  }, 15000)
})
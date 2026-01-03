/**
 * Property-Based Tests for Leave Request Status Management
 * **Feature: dayflow-hrms, Property 13: Leave request status management**
 * **Validates: Requirements 9.2, 9.3, 9.5**
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

const statusArbitrary = fc.oneof(
  fc.constant('pending' as const),
  fc.constant('approved' as const),
  fc.constant('rejected' as const)
)

const adminCommentArbitrary = fc.option(fc.string({ minLength: 1, maxLength: 100 }))

describe('Leave Request Status Management Properties', () => {
  beforeEach(() => {
    // Clear any existing leave requests
    const mockLeaveRequests = require('@/services/mock-data').mockLeaveRequests
    mockLeaveRequests.length = 0
  })

  it('should maintain status consistency throughout lifecycle', async () => {
    await fc.assert(fc.asyncProperty(
      leaveRequestDataArbitrary,
      adminCommentArbitrary,
      async (requestData, adminComment) => {
        // Create a leave request (should start as pending)
        const createdRequest = await leaveService.create(requestData)
        expect(createdRequest.status).toBe('pending')

        // Test approval workflow
        const approvedRequest = await (leaveService as any).approveRequest(
          createdRequest.id, 
          adminComment || undefined
        )
        expect(approvedRequest.status).toBe('approved')
        expect(approvedRequest.id).toBe(createdRequest.id)

        // Verify status persists when retrieved
        const retrievedApproved = await leaveService.getById(createdRequest.id)
        expect(retrievedApproved.status).toBe('approved')

        // Test rejection workflow (create new request since we can't change approved back to pending)
        const newRequest = await leaveService.create(requestData)
        const rejectedRequest = await (leaveService as any).rejectRequest(
          newRequest.id, 
          adminComment || undefined
        )
        expect(rejectedRequest.status).toBe('rejected')

        // Verify rejection persists when retrieved
        const retrievedRejected = await leaveService.getById(newRequest.id)
        expect(retrievedRejected.status).toBe('rejected')
      }
    ), { numRuns: 3 })
  }, 15000)

  it('should preserve admin comments with status changes', async () => {
    await fc.assert(fc.asyncProperty(
      leaveRequestDataArbitrary,
      fc.string({ minLength: 1, maxLength: 100 }), // Required admin comment
      async (requestData, adminComment) => {
        // Create a leave request
        const createdRequest = await leaveService.create(requestData)

        // Approve with comment
        const approvedRequest = await (leaveService as any).approveRequest(
          createdRequest.id, 
          adminComment
        )
        expect(approvedRequest.adminComment).toBe(adminComment)

        // Create another request to test rejection
        const newRequest = await leaveService.create(requestData)
        const rejectedRequest = await (leaveService as any).rejectRequest(
          newRequest.id, 
          adminComment
        )
        expect(rejectedRequest.adminComment).toBe(adminComment)
      }
    ), { numRuns: 3 })
  }, 10000)

  it('should handle status transitions correctly', async () => {
    await fc.assert(fc.asyncProperty(
      leaveRequestDataArbitrary,
      async (requestData) => {
        // Create request (pending)
        const request = await leaveService.create(requestData)
        expect(request.status).toBe('pending')

        // Only pending requests should be modifiable
        // Test that we can approve pending requests
        const approvedRequest = await (leaveService as any).approveRequest(request.id)
        expect(approvedRequest.status).toBe('approved')

        // Create another request to test rejection
        const newRequest = await leaveService.create(requestData)
        const rejectedRequest = await (leaveService as any).rejectRequest(newRequest.id)
        expect(rejectedRequest.status).toBe('rejected')
      }
    ), { numRuns: 3 })
  }, 10000)

  it('should maintain data integrity during status updates', async () => {
    await fc.assert(fc.asyncProperty(
      leaveRequestDataArbitrary,
      adminCommentArbitrary,
      async (requestData, adminComment) => {
        // Create request
        const originalRequest = await leaveService.create(requestData)

        // Update status and verify all other data remains unchanged
        const updatedRequest = await (leaveService as any).approveRequest(
          originalRequest.id, 
          adminComment || undefined
        )

        // Verify core data integrity
        expect(updatedRequest.employeeId).toBe(originalRequest.employeeId)
        expect(updatedRequest.type).toBe(originalRequest.type)
        expect(updatedRequest.reason).toBe(originalRequest.reason)
        expect(new Date(updatedRequest.fromDate).getTime()).toBe(new Date(originalRequest.fromDate).getTime())
        expect(new Date(updatedRequest.toDate).getTime()).toBe(new Date(originalRequest.toDate).getTime())
        expect(updatedRequest.id).toBe(originalRequest.id)
        expect(updatedRequest.createdAt).toEqual(originalRequest.createdAt)

        // Only status and admin comment should change
        expect(updatedRequest.status).toBe('approved')
        if (adminComment) {
          expect(updatedRequest.adminComment).toBe(adminComment)
        }
        expect(updatedRequest.updatedAt).not.toEqual(originalRequest.updatedAt)
      }
    ), { numRuns: 3 })
  }, 10000)

})
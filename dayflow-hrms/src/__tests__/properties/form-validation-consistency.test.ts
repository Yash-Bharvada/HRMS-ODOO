/**
 * Property-Based Tests for Form Validation Consistency
 * **Feature: dayflow-hrms, Property 14: Form validation consistency**
 * **Validates: Requirements 8.5, 11.5**
 */

import * as fc from 'fast-check'

// Mock validation functions that would be used in the leave form
const validateLeaveType = (type: string): string | null => {
  const validTypes = ['paid', 'sick', 'unpaid']
  if (!type || !validTypes.includes(type)) {
    return 'Leave type is required and must be paid, sick, or unpaid'
  }
  return null
}

const validateDate = (date: string, fieldName: string): string | null => {
  if (!date) {
    return `${fieldName} is required`
  }
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return `${fieldName} must be a valid date`
  }
  
  if (dateObj < new Date()) {
    return `${fieldName} cannot be in the past`
  }
  
  return null
}

const validateDateRange = (fromDate: string, toDate: string): string | null => {
  if (!fromDate || !toDate) {
    return null // Individual date validation will catch missing dates
  }
  
  const from = new Date(fromDate)
  const to = new Date(toDate)
  
  if (from > to) {
    return 'To date must be after from date'
  }
  
  return null
}

const validateReason = (reason: string): string | null => {
  if (!reason || !reason.trim()) {
    return 'Reason is required'
  }
  
  if (reason.trim().length < 10) {
    return 'Reason must be at least 10 characters'
  }
  
  if (reason.trim().length > 500) {
    return 'Reason must be less than 500 characters'
  }
  
  return null
}

// Form validation function that combines all validations
const validateLeaveForm = (formData: {
  type: string
  fromDate: string
  toDate: string
  reason: string
}): { [key: string]: string } => {
  const errors: { [key: string]: string } = {}
  
  const typeError = validateLeaveType(formData.type)
  if (typeError) errors.type = typeError
  
  const fromDateError = validateDate(formData.fromDate, 'From date')
  if (fromDateError) errors.fromDate = fromDateError
  
  const toDateError = validateDate(formData.toDate, 'To date')
  if (toDateError) errors.toDate = toDateError
  
  const dateRangeError = validateDateRange(formData.fromDate, formData.toDate)
  if (dateRangeError) errors.toDate = dateRangeError
  
  const reasonError = validateReason(formData.reason)
  if (reasonError) errors.reason = reasonError
  
  return errors
}

// Arbitraries for generating test data
const leaveTypeArbitrary = fc.oneof(
  fc.constant('paid'),
  fc.constant('sick'),
  fc.constant('unpaid'),
  fc.constant(''), // Invalid empty
  fc.constant('invalid'), // Invalid type
  fc.string({ minLength: 1, maxLength: 20 }) // Random invalid strings
)

const dateStringArbitrary = fc.oneof(
  fc.date({ min: new Date(Date.now() + 24 * 60 * 60 * 1000), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
    .map(d => {
      try {
        return d.toISOString().split('T')[0]
      } catch {
        return '2025-01-01' // Fallback for invalid dates
      }
    }), // Valid future dates
  fc.date({ min: new Date('2020-01-01'), max: new Date(Date.now() - 24 * 60 * 60 * 1000) })
    .map(d => {
      try {
        return d.toISOString().split('T')[0]
      } catch {
        return '2023-01-01' // Fallback for invalid dates
      }
    }), // Invalid past dates
  fc.constant(''), // Empty string
  fc.constant('invalid-date'), // Invalid format
  fc.string({ minLength: 1, maxLength: 20 }) // Random invalid strings
)

const reasonArbitrary = fc.oneof(
  fc.string({ minLength: 10, maxLength: 500 }), // Valid reasons
  fc.string({ minLength: 0, maxLength: 9 }), // Too short
  fc.string({ minLength: 501, maxLength: 1000 }), // Too long
  fc.constant(''), // Empty
  fc.constant('   ') // Whitespace only
)

const formDataArbitrary = fc.record({
  type: leaveTypeArbitrary,
  fromDate: dateStringArbitrary,
  toDate: dateStringArbitrary,
  reason: reasonArbitrary
})

describe('Form Validation Consistency Properties', () => {
  it('should consistently validate leave type across all inputs', () => {
    fc.assert(fc.property(
      leaveTypeArbitrary,
      (type) => {
        const error = validateLeaveType(type)
        
        // Valid types should not produce errors
        if (['paid', 'sick', 'unpaid'].includes(type)) {
          expect(error).toBeNull()
        } else {
          // Invalid types should always produce errors
          expect(error).toBeTruthy()
          expect(typeof error).toBe('string')
        }
      }
    ), { numRuns: 100 })
  })

  it('should consistently validate dates across all inputs', () => {
    fc.assert(fc.property(
      dateStringArbitrary,
      fc.string({ minLength: 1, maxLength: 20 }), // Field name
      (dateStr, fieldName) => {
        const error = validateDate(dateStr, fieldName)
        
        if (!dateStr) {
          // Empty dates should always produce "required" error
          expect(error).toContain('required')
        } else {
          const dateObj = new Date(dateStr)
          if (isNaN(dateObj.getTime())) {
            // Invalid dates should produce "valid date" error
            expect(error).toContain('valid date')
          } else if (dateObj < new Date()) {
            // Past dates should produce "past" error
            expect(error).toContain('past')
          } else {
            // Valid future dates should not produce errors
            expect(error).toBeNull()
          }
        }
      }
    ), { numRuns: 100 })
  })

  it('should consistently validate reason field across all inputs', () => {
    fc.assert(fc.property(
      reasonArbitrary,
      (reason) => {
        const error = validateReason(reason)
        
        if (!reason || !reason.trim()) {
          // Empty or whitespace-only reasons should produce "required" error
          expect(error).toContain('required')
        } else if (reason.trim().length < 10) {
          // Short reasons should produce "at least 10 characters" error
          expect(error).toContain('at least 10 characters')
        } else if (reason.trim().length > 500) {
          // Long reasons should produce "less than 500 characters" error
          expect(error).toContain('less than 500 characters')
        } else {
          // Valid reasons should not produce errors
          expect(error).toBeNull()
        }
      }
    ), { numRuns: 100 })
  })

  it('should maintain validation consistency across form submissions', () => {
    fc.assert(fc.property(
      formDataArbitrary,
      (formData) => {
        // Validate the form multiple times with the same data
        const errors1 = validateLeaveForm(formData)
        const errors2 = validateLeaveForm(formData)
        const errors3 = validateLeaveForm(formData)
        
        // Results should be identical across multiple validations
        expect(errors1).toEqual(errors2)
        expect(errors2).toEqual(errors3)
        
        // Error structure should be consistent
        Object.keys(errors1).forEach(field => {
          expect(typeof errors1[field]).toBe('string')
          expect(errors1[field].length).toBeGreaterThan(0)
        })
      }
    ), { numRuns: 100 })
  })

  it('should validate date ranges consistently', () => {
    fc.assert(fc.property(
      dateStringArbitrary,
      dateStringArbitrary,
      (fromDate, toDate) => {
        const error = validateDateRange(fromDate, toDate)
        
        if (!fromDate || !toDate) {
          // Missing dates should not produce range errors (handled by individual validation)
          expect(error).toBeNull()
        } else {
          const from = new Date(fromDate)
          const to = new Date(toDate)
          
          if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            // Invalid dates should not produce range errors (handled by individual validation)
            expect(error).toBeNull()
          } else if (from > to) {
            // Invalid range should produce error
            expect(error).toContain('after')
          } else {
            // Valid range should not produce error
            expect(error).toBeNull()
          }
        }
      }
    ), { numRuns: 100 })
  })

  it('should produce deterministic validation results', () => {
    fc.assert(fc.property(
      formDataArbitrary,
      (formData) => {
        // Same input should always produce same output
        const result1 = validateLeaveForm(formData)
        const result2 = validateLeaveForm(formData)
        
        expect(result1).toEqual(result2)
        
        // Validation should be pure (no side effects)
        const originalFormData = { ...formData }
        validateLeaveForm(formData)
        expect(formData).toEqual(originalFormData)
      }
    ), { numRuns: 100 })
  })

  it('should handle edge cases consistently', () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.constant({ type: '', fromDate: '', toDate: '', reason: '' }), // All empty
        fc.constant({ type: 'paid', fromDate: '2024-01-01', toDate: '2023-12-31', reason: 'Valid reason but invalid date range' }), // Invalid range
        fc.constant({ type: 'paid', fromDate: '2025-01-01', toDate: '2025-01-02', reason: '   ' }), // Whitespace reason
        fc.constant({ type: 'invalid', fromDate: 'not-a-date', toDate: 'also-not-a-date', reason: 'short' }) // Multiple errors
      ),
      (formData) => {
        const errors = validateLeaveForm(formData)
        
        // Should always return an object
        expect(typeof errors).toBe('object')
        expect(errors).not.toBeNull()
        
        // Error messages should be strings when present
        Object.values(errors).forEach(error => {
          expect(typeof error).toBe('string')
          expect(error.length).toBeGreaterThan(0)
        })
      }
    ), { numRuns: 50 })
  })
})
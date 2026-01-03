/**
 * Property-Based Test for Date Filtering Functionality
 * **Feature: dayflow-hrms, Property 11: Date filtering functionality**
 * **Validates: Requirements 7.3**
 */

import * as fc from 'fast-check'
import { AttendanceRecord } from '@/types'

// Date filtering utility function
function filterAttendanceByDate(records: AttendanceRecord[], filterDate: string): AttendanceRecord[] {
  if (!filterDate) {
    return records
  }
  
  return records.filter(record => record.date === filterDate)
}

// Date range filtering function
function filterAttendanceByDateRange(
  records: AttendanceRecord[], 
  startDate: string, 
  endDate: string
): AttendanceRecord[] {
  if (!startDate && !endDate) {
    return records
  }
  
  return records.filter(record => {
    const recordDate = record.date
    
    if (startDate && recordDate < startDate) {
      return false
    }
    
    if (endDate && recordDate > endDate) {
      return false
    }
    
    return true
  })
}

// Generators for property-based testing
const dateStringArbitrary = fc.date({ 
  min: new Date('2024-01-01'), 
  max: new Date('2024-12-31') 
}).map(date => {
  try {
    return date.toISOString().split('T')[0]
  } catch {
    return '2024-06-01' // Fallback for invalid dates
  }
})

const attendanceRecordArbitrary = fc.record({
  id: fc.string({ minLength: 1 }),
  employeeId: fc.string({ minLength: 1 }),
  date: dateStringArbitrary,
  checkIn: fc.option(fc.date()),
  checkOut: fc.option(fc.date()),
  status: fc.constantFrom('present' as const, 'half-day' as const, 'absent' as const, 'leave' as const),
  duration: fc.option(fc.float({ min: 0, max: 12 })),
  createdAt: fc.date(),
  updatedAt: fc.date()
})

const attendanceRecordsArbitrary = fc.array(attendanceRecordArbitrary, { minLength: 0, maxLength: 50 })

describe('Date Filtering Functionality Properties', () => {
  it('should return empty array when filtering empty records', () => {
    fc.assert(fc.property(
      dateStringArbitrary,
      (filterDate) => {
        const emptyRecords: AttendanceRecord[] = []
        const filtered = filterAttendanceByDate(emptyRecords, filterDate)
        expect(filtered).toEqual([])
        expect(filtered.length).toBe(0)
      }
    ), { numRuns: 100 })
  })

  it('should return all records when no filter date is provided', () => {
    fc.assert(fc.property(
      attendanceRecordsArbitrary,
      (records) => {
        const filtered = filterAttendanceByDate(records, '')
        expect(filtered).toEqual(records)
        expect(filtered.length).toBe(records.length)
      }
    ), { numRuns: 100 })
  })

  it('should only return records matching the exact filter date', () => {
    fc.assert(fc.property(
      attendanceRecordsArbitrary,
      dateStringArbitrary,
      (records, filterDate) => {
        const filtered = filterAttendanceByDate(records, filterDate)
        
        // All filtered records should have the exact filter date
        for (const record of filtered) {
          expect(record.date).toBe(filterDate)
        }
        
        // Count should match manual filter
        const expectedCount = records.filter(r => r.date === filterDate).length
        expect(filtered.length).toBe(expectedCount)
      }
    ), { numRuns: 100 })
  })

  it('should be idempotent - filtering twice gives same result', () => {
    fc.assert(fc.property(
      attendanceRecordsArbitrary,
      dateStringArbitrary,
      (records, filterDate) => {
        const filtered1 = filterAttendanceByDate(records, filterDate)
        const filtered2 = filterAttendanceByDate(filtered1, filterDate)
        
        expect(filtered2).toEqual(filtered1)
        expect(filtered2.length).toBe(filtered1.length)
      }
    ), { numRuns: 100 })
  })

  it('should preserve record order when filtering', () => {
    fc.assert(fc.property(
      attendanceRecordsArbitrary,
      dateStringArbitrary,
      (records, filterDate) => {
        const filtered = filterAttendanceByDate(records, filterDate)
        
        // Find indices of matching records in original array
        const matchingIndices: number[] = []
        records.forEach((record, index) => {
          if (record.date === filterDate) {
            matchingIndices.push(index)
          }
        })
        
        // Verify order is preserved
        for (let i = 1; i < matchingIndices.length; i++) {
          expect(matchingIndices[i]).toBeGreaterThan(matchingIndices[i - 1])
        }
        
        // Verify filtered records match original order
        const expectedRecords = matchingIndices.map(index => records[index])
        expect(filtered).toEqual(expectedRecords)
      }
    ), { numRuns: 100 })
  })

  it('should handle date range filtering correctly', () => {
    fc.assert(fc.property(
      attendanceRecordsArbitrary,
      dateStringArbitrary,
      dateStringArbitrary,
      (records, date1, date2) => {
        // Ensure proper order
        const startDate = date1 <= date2 ? date1 : date2
        const endDate = date1 <= date2 ? date2 : date1
        
        const filtered = filterAttendanceByDateRange(records, startDate, endDate)
        
        // All filtered records should be within the date range
        for (const record of filtered) {
          expect(record.date >= startDate).toBe(true)
          expect(record.date <= endDate).toBe(true)
        }
        
        // Count should match manual filter
        const expectedCount = records.filter(r => 
          r.date >= startDate && r.date <= endDate
        ).length
        expect(filtered.length).toBe(expectedCount)
      }
    ), { numRuns: 100 })
  })

  it('should return all records when no date range is provided', () => {
    fc.assert(fc.property(
      attendanceRecordsArbitrary,
      (records) => {
        const filtered = filterAttendanceByDateRange(records, '', '')
        expect(filtered).toEqual(records)
        expect(filtered.length).toBe(records.length)
      }
    ), { numRuns: 100 })
  })

  it('should handle single-date range (start date only)', () => {
    fc.assert(fc.property(
      attendanceRecordsArbitrary,
      dateStringArbitrary,
      (records, startDate) => {
        const filtered = filterAttendanceByDateRange(records, startDate, '')
        
        // All filtered records should be on or after start date
        for (const record of filtered) {
          expect(record.date >= startDate).toBe(true)
        }
        
        // Count should match manual filter
        const expectedCount = records.filter(r => r.date >= startDate).length
        expect(filtered.length).toBe(expectedCount)
      }
    ), { numRuns: 100 })
  })

  it('should handle single-date range (end date only)', () => {
    fc.assert(fc.property(
      attendanceRecordsArbitrary,
      dateStringArbitrary,
      (records, endDate) => {
        const filtered = filterAttendanceByDateRange(records, '', endDate)
        
        // All filtered records should be on or before end date
        for (const record of filtered) {
          expect(record.date <= endDate).toBe(true)
        }
        
        // Count should match manual filter
        const expectedCount = records.filter(r => r.date <= endDate).length
        expect(filtered.length).toBe(expectedCount)
      }
    ), { numRuns: 100 })
  })

  it('should be consistent across multiple calls with same parameters', () => {
    fc.assert(fc.property(
      attendanceRecordsArbitrary,
      dateStringArbitrary,
      (records, filterDate) => {
        const filtered1 = filterAttendanceByDate(records, filterDate)
        const filtered2 = filterAttendanceByDate(records, filterDate)
        const filtered3 = filterAttendanceByDate(records, filterDate)
        
        expect(filtered2).toEqual(filtered1)
        expect(filtered3).toEqual(filtered1)
      }
    ), { numRuns: 100 })
  })

  it('should handle edge case of filtering by non-existent date', () => {
    fc.assert(fc.property(
      attendanceRecordsArbitrary,
      (records) => {
        // Use a date that's very unlikely to exist in generated data
        const nonExistentDate = '1999-01-01'
        const filtered = filterAttendanceByDate(records, nonExistentDate)
        
        // Should return empty array unless records actually contain this date
        const expectedCount = records.filter(r => r.date === nonExistentDate).length
        expect(filtered.length).toBe(expectedCount)
        
        // All returned records (if any) should match the filter date
        for (const record of filtered) {
          expect(record.date).toBe(nonExistentDate)
        }
      }
    ), { numRuns: 100 })
  })

  it('should maintain referential integrity - filtered records are same objects', () => {
    fc.assert(fc.property(
      attendanceRecordsArbitrary,
      dateStringArbitrary,
      (records, filterDate) => {
        const filtered = filterAttendanceByDate(records, filterDate)
        
        // Each filtered record should be the exact same object reference from original array
        for (const filteredRecord of filtered) {
          const originalRecord = records.find(r => r.id === filteredRecord.id)
          expect(filteredRecord).toBe(originalRecord) // Same reference
        }
      }
    ), { numRuns: 100 })
  })

  it('should handle filtering with duplicate dates correctly', () => {
    fc.assert(fc.property(
      dateStringArbitrary,
      fc.integer({ min: 1, max: 10 }),
      (duplicateDate, count) => {
        // Create records with duplicate dates
        const recordsWithDuplicates: AttendanceRecord[] = Array.from({ length: count }, (_, i) => ({
          id: `record_${i}`,
          employeeId: `emp_${i}`,
          date: duplicateDate,
          status: 'present' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
        
        const filtered = filterAttendanceByDate(recordsWithDuplicates, duplicateDate)
        
        // Should return all records with the duplicate date
        expect(filtered.length).toBe(count)
        
        // All records should have the filter date
        for (const record of filtered) {
          expect(record.date).toBe(duplicateDate)
        }
      }
    ), { numRuns: 100 })
  })

  it('should handle mixed date formats gracefully', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        id: fc.string({ minLength: 1 }),
        employeeId: fc.string({ minLength: 1 }),
        date: fc.oneof(
          dateStringArbitrary, // Valid ISO date strings
          fc.constant('invalid-date'), // Invalid date string
          fc.constant('') // Empty string
        ),
        status: fc.constantFrom('present' as const, 'half-day' as const, 'absent' as const, 'leave' as const),
        createdAt: fc.date(),
        updatedAt: fc.date()
      }), { minLength: 0, maxLength: 20 }),
      dateStringArbitrary,
      (mixedRecords, filterDate) => {
        const filtered = filterAttendanceByDate(mixedRecords, filterDate)
        
        // Should only return records with exact matching date
        for (const record of filtered) {
          expect(record.date).toBe(filterDate)
        }
        
        // Count should match manual filter
        const expectedCount = mixedRecords.filter(r => r.date === filterDate).length
        expect(filtered.length).toBe(expectedCount)
      }
    ), { numRuns: 100 })
  })
})
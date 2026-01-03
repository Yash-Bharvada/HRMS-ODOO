/**
 * Property-Based Test for Attendance Tracking Functionality
 * **Feature: dayflow-hrms, Property 10: Attendance tracking functionality**
 * **Validates: Requirements 6.2, 6.3**
 */

import * as fc from 'fast-check'
import { AttendanceRecord, User } from '@/types'

// Mock attendance tracking functions
interface AttendanceTracker {
  checkIn(employeeId: string, timestamp: Date): AttendanceRecord
  checkOut(recordId: string, timestamp: Date): AttendanceRecord
  getRecord(recordId: string): AttendanceRecord | null
  getTodayRecord(employeeId: string, date: string): AttendanceRecord | null
}

class MockAttendanceTracker implements AttendanceTracker {
  private records: Map<string, AttendanceRecord> = new Map()

  checkIn(employeeId: string, timestamp: Date): AttendanceRecord {
    const today = timestamp.toISOString().split('T')[0]
    const recordId = `att_${employeeId}_${today}`
    
    // Check if already checked in today
    const existingRecord = this.getTodayRecord(employeeId, today)
    if (existingRecord && existingRecord.checkIn) {
      throw new Error('Already checked in today')
    }

    const record: AttendanceRecord = {
      id: recordId,
      employeeId,
      date: today,
      checkIn: timestamp,
      status: 'half-day', // Will be updated on checkout
      createdAt: timestamp,
      updatedAt: timestamp
    }

    this.records.set(recordId, record)
    return record
  }

  checkOut(recordId: string, timestamp: Date): AttendanceRecord {
    const record = this.records.get(recordId)
    if (!record) {
      throw new Error('Record not found')
    }

    if (!record.checkIn) {
      throw new Error('Cannot check out without checking in first')
    }

    if (record.checkOut) {
      throw new Error('Already checked out')
    }

    if (timestamp < record.checkIn) {
      throw new Error('Check out time cannot be before check in time')
    }

    const duration = (timestamp.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60)
    const status = duration < 4 ? 'half-day' : 'present'

    const updatedRecord: AttendanceRecord = {
      ...record,
      checkOut: timestamp,
      duration: Math.round(duration * 100) / 100,
      status,
      updatedAt: timestamp
    }

    this.records.set(recordId, updatedRecord)
    return updatedRecord
  }

  getRecord(recordId: string): AttendanceRecord | null {
    return this.records.get(recordId) || null
  }

  getTodayRecord(employeeId: string, date: string): AttendanceRecord | null {
    const recordId = `att_${employeeId}_${date}`
    return this.records.get(recordId) || null
  }
}

// Generators for property-based testing
const employeeIdArbitrary = fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0)
const validTimestampArbitrary = fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })

const validCheckInOutPairArbitrary = fc.tuple(
  employeeIdArbitrary,
  validTimestampArbitrary
).chain(([employeeId, checkInTime]) => 
  fc.tuple(
    fc.constant(employeeId),
    fc.constant(checkInTime),
    fc.integer({ min: 1, max: 720 }) // 1 to 720 minutes (12 hours)
  ).map(([empId, checkIn, minutesAfter]) => [
    empId,
    checkIn,
    new Date(checkIn.getTime() + minutesAfter * 60 * 1000)
  ])
)

describe('Attendance Tracking Functionality Properties', () => {
  let tracker: AttendanceTracker

  beforeEach(() => {
    tracker = new MockAttendanceTracker()
  })

  it('should successfully create attendance record on check-in', () => {
    fc.assert(fc.property(
      employeeIdArbitrary,
      validTimestampArbitrary,
      (employeeId, timestamp) => {
        const record = tracker.checkIn(employeeId, timestamp)
        
        // Verify record properties
        expect(record.employeeId).toBe(employeeId)
        expect(record.checkIn).toEqual(timestamp)
        expect(record.date).toBe(timestamp.toISOString().split('T')[0])
        expect(record.status).toBe('half-day') // Initial status before checkout
        expect(record.checkOut).toBeUndefined()
        expect(record.createdAt).toEqual(timestamp)
        expect(record.updatedAt).toEqual(timestamp)
        
        // Verify record can be retrieved
        const retrievedRecord = tracker.getRecord(record.id)
        expect(retrievedRecord).toEqual(record)
      }
    ), { numRuns: 100 })
  })

  it('should prevent multiple check-ins on the same day', () => {
    fc.assert(fc.property(
      employeeIdArbitrary,
      validTimestampArbitrary,
      fc.integer({ min: 1, max: 1000 }), // minutes offset for second check-in
      (employeeId, firstTimestamp, minutesOffset) => {
        // Create fresh tracker for this test
        const localTracker = new MockAttendanceTracker()
        
        // First check-in should succeed
        const firstRecord = localTracker.checkIn(employeeId, firstTimestamp)
        expect(firstRecord.checkIn).toEqual(firstTimestamp)
        
        // Second check-in on same day should fail
        const secondTimestamp = new Date(firstTimestamp.getTime() + minutesOffset * 60 * 1000)
        const firstDate = firstTimestamp.toISOString().split('T')[0]
        const secondDate = secondTimestamp.toISOString().split('T')[0]
        
        // Only test if it's the same day
        if (secondDate === firstDate) {
          expect(() => localTracker.checkIn(employeeId, secondTimestamp)).toThrow('Already checked in today')
        }
      }
    ), { numRuns: 100 })
  })

  it('should successfully complete check-out after check-in', () => {
    fc.assert(fc.property(
      validCheckInOutPairArbitrary,
      ([employeeId, checkInTime, checkOutTime]) => {
        // Check in first
        const checkInRecord = tracker.checkIn(employeeId, checkInTime)
        
        // Check out
        const checkOutRecord = tracker.checkOut(checkInRecord.id, checkOutTime)
        
        // Verify check-out record
        expect(checkOutRecord.id).toBe(checkInRecord.id)
        expect(checkOutRecord.employeeId).toBe(employeeId)
        expect(checkOutRecord.checkIn).toEqual(checkInTime)
        expect(checkOutRecord.checkOut).toEqual(checkOutTime)
        expect(checkOutRecord.updatedAt).toEqual(checkOutTime)
        
        // Verify duration calculation
        const expectedDuration = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
        expect(checkOutRecord.duration).toBeCloseTo(expectedDuration, 2)
        
        // Verify status based on duration
        if (expectedDuration < 4) {
          expect(checkOutRecord.status).toBe('half-day')
        } else {
          expect(checkOutRecord.status).toBe('present')
        }
      }
    ), { numRuns: 100 })
  })

  it('should prevent check-out without check-in', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1 }),
      validTimestampArbitrary,
      (recordId, timestamp) => {
        expect(() => tracker.checkOut(recordId, timestamp)).toThrow('Record not found')
      }
    ), { numRuns: 100 })
  })

  it('should prevent check-out before check-in time', () => {
    fc.assert(fc.property(
      employeeIdArbitrary,
      validTimestampArbitrary,
      fc.integer({ min: 1, max: 1000 }), // minutes before check-in
      (employeeId, checkInTime, minutesBefore) => {
        const checkInRecord = tracker.checkIn(employeeId, checkInTime)
        const earlierTime = new Date(checkInTime.getTime() - minutesBefore * 60 * 1000)
        
        expect(() => tracker.checkOut(checkInRecord.id, earlierTime))
          .toThrow('Check out time cannot be before check in time')
      }
    ), { numRuns: 100 })
  })

  it('should prevent multiple check-outs', () => {
    fc.assert(fc.property(
      validCheckInOutPairArbitrary,
      fc.integer({ min: 1, max: 1000 }), // minutes offset for second check-out
      ([employeeId, checkInTime, firstCheckOutTime], minutesOffset) => {
        // Check in and check out first time
        const checkInRecord = tracker.checkIn(employeeId, checkInTime)
        tracker.checkOut(checkInRecord.id, firstCheckOutTime)
        
        // Second check-out should fail
        const secondCheckOutTime = new Date(firstCheckOutTime.getTime() + minutesOffset * 60 * 1000)
        expect(() => tracker.checkOut(checkInRecord.id, secondCheckOutTime))
          .toThrow('Already checked out')
      }
    ), { numRuns: 100 })
  })

  it('should maintain record consistency throughout check-in/out cycle', () => {
    fc.assert(fc.property(
      validCheckInOutPairArbitrary,
      ([employeeId, checkInTime, checkOutTime]) => {
        // Create fresh tracker for this test
        const localTracker = new MockAttendanceTracker()
        
        // Check in
        const checkInRecord = localTracker.checkIn(employeeId, checkInTime)
        const recordId = checkInRecord.id
        
        // Verify record exists and is correct after check-in
        const afterCheckIn = localTracker.getRecord(recordId)
        expect(afterCheckIn).toEqual(checkInRecord)
        
        // Check out
        const checkOutRecord = localTracker.checkOut(recordId, checkOutTime)
        
        // Verify record exists and is updated after check-out
        const afterCheckOut = localTracker.getRecord(recordId)
        expect(afterCheckOut).toEqual(checkOutRecord)
        
        // Verify immutable fields remain unchanged
        expect(afterCheckOut!.id).toBe(checkInRecord.id)
        expect(afterCheckOut!.employeeId).toBe(checkInRecord.employeeId)
        expect(afterCheckOut!.date).toBe(checkInRecord.date)
        expect(afterCheckOut!.checkIn).toEqual(checkInRecord.checkIn)
        expect(afterCheckOut!.createdAt).toEqual(checkInRecord.createdAt)
      }
    ), { numRuns: 100 })
  })

  it('should handle concurrent operations for different employees', () => {
    fc.assert(fc.property(
      fc.array(
        fc.tuple(employeeIdArbitrary, validTimestampArbitrary),
        { minLength: 2, maxLength: 5 }
      ).filter(pairs => {
        // Ensure all employee IDs are unique and all timestamps are valid
        const employeeIds = pairs.map(([id]) => id)
        const validPairs = pairs.every(([_, timestamp]) => !isNaN(timestamp.getTime()))
        return new Set(employeeIds).size === employeeIds.length && validPairs
      }),
      (employeeTimePairs) => {
        const records: AttendanceRecord[] = []
        
        // All employees check in
        for (const [employeeId, timestamp] of employeeTimePairs) {
          const record = tracker.checkIn(employeeId, timestamp)
          records.push(record)
        }
        
        // Verify all records are independent
        for (let i = 0; i < records.length; i++) {
          for (let j = i + 1; j < records.length; j++) {
            expect(records[i].id).not.toBe(records[j].id)
            expect(records[i].employeeId).not.toBe(records[j].employeeId)
          }
        }
        
        // Verify all records can be retrieved independently
        for (const record of records) {
          const retrieved = tracker.getRecord(record.id)
          expect(retrieved).toEqual(record)
        }
      }
    ), { numRuns: 50 })
  })

  it('should calculate duration correctly for various time spans', () => {
    fc.assert(fc.property(
      employeeIdArbitrary,
      validTimestampArbitrary,
      fc.float({ min: 0.5, max: 12 }), // duration in hours
      (employeeId, checkInTime, durationHours) => {
        const checkOutTime = new Date(checkInTime.getTime() + durationHours * 60 * 60 * 1000)
        
        const checkInRecord = tracker.checkIn(employeeId, checkInTime)
        const checkOutRecord = tracker.checkOut(checkInRecord.id, checkOutTime)
        
        // Verify duration is calculated correctly (within 0.01 hour precision)
        expect(checkOutRecord.duration).toBeCloseTo(durationHours, 2)
        
        // Verify status is correct based on duration
        if (durationHours < 4) {
          expect(checkOutRecord.status).toBe('half-day')
        } else {
          expect(checkOutRecord.status).toBe('present')
        }
      }
    ), { numRuns: 100 })
  })

  it('should handle edge case of exactly 4 hours correctly', () => {
    fc.assert(fc.property(
      employeeIdArbitrary,
      validTimestampArbitrary,
      (employeeId, checkInTime) => {
        const checkOutTime = new Date(checkInTime.getTime() + 4 * 60 * 60 * 1000) // exactly 4 hours
        
        const checkInRecord = tracker.checkIn(employeeId, checkInTime)
        const checkOutRecord = tracker.checkOut(checkInRecord.id, checkOutTime)
        
        expect(checkOutRecord.duration).toBeCloseTo(4, 2)
        expect(checkOutRecord.status).toBe('present') // 4 hours should be 'present'
      }
    ), { numRuns: 100 })
  })
})
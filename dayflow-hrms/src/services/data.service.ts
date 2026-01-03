// Data service interface and implementation
// Basic implementation for profile management - will be fully implemented in task 13

import { DataService, User, AttendanceRecord, LeaveRequest, PayrollData, LeaveService } from '@/types'
import { mockUsers, mockLeaveRequests, mockAttendance } from './mock-data'

// Attendance service implementation for attendance management
export class MockAttendanceService implements DataService<AttendanceRecord> {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getAll(): Promise<AttendanceRecord[]> {
    await this.delay(400 + Math.random() * 200)
    return [...mockAttendance]
  }

  async getById(id: string): Promise<AttendanceRecord> {
    await this.delay(400 + Math.random() * 200)
    const record = mockAttendance.find(r => r.id === id)
    if (!record) {
      throw new Error('Attendance record not found')
    }
    return { ...record }
  }

  async create(item: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AttendanceRecord> {
    await this.delay(500 + Math.random() * 300)
    const newRecord: AttendanceRecord = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    mockAttendance.push(newRecord)
    return { ...newRecord }
  }

  async update(id: string, item: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    await this.delay(400 + Math.random() * 200)
    const recordIndex = mockAttendance.findIndex(r => r.id === id)
    if (recordIndex === -1) {
      throw new Error('Attendance record not found')
    }
    
    const updatedRecord = {
      ...mockAttendance[recordIndex],
      ...item,
      updatedAt: new Date()
    }
    
    mockAttendance[recordIndex] = updatedRecord
    return { ...updatedRecord }
  }

  async delete(id: string): Promise<void> {
    await this.delay(300 + Math.random() * 200)
    const recordIndex = mockAttendance.findIndex(r => r.id === id)
    if (recordIndex === -1) {
      throw new Error('Attendance record not found')
    }
    mockAttendance.splice(recordIndex, 1)
  }

  // Additional methods for attendance management
  async getByEmployeeId(employeeId: string): Promise<AttendanceRecord[]> {
    await this.delay(400 + Math.random() * 200)
    return mockAttendance.filter(r => r.employeeId === employeeId)
  }

  async getByDateRange(startDate: string, endDate?: string): Promise<AttendanceRecord[]> {
    await this.delay(400 + Math.random() * 200)
    return mockAttendance.filter(record => {
      const recordDate = record.date
      if (endDate) {
        return recordDate >= startDate && recordDate <= endDate
      }
      return recordDate === startDate
    })
  }

  async checkIn(employeeId: string, timestamp: Date = new Date()): Promise<AttendanceRecord> {
    const today = timestamp.toISOString().split('T')[0]
    const existingRecord = mockAttendance.find(r => 
      r.employeeId === employeeId && r.date === today
    )

    if (existingRecord && existingRecord.checkIn) {
      throw new Error('Already checked in today')
    }

    if (existingRecord) {
      // Update existing record with check-in
      return this.update(existingRecord.id, {
        checkIn: timestamp,
        status: 'half-day' // Will be updated to 'present' on check-out
      })
    } else {
      // Create new record
      return this.create({
        employeeId,
        date: today,
        checkIn: timestamp,
        status: 'half-day'
      })
    }
  }

  async checkOut(employeeId: string, timestamp: Date = new Date()): Promise<AttendanceRecord> {
    const today = timestamp.toISOString().split('T')[0]
    const existingRecord = mockAttendance.find(r => 
      r.employeeId === employeeId && r.date === today
    )

    if (!existingRecord || !existingRecord.checkIn) {
      throw new Error('Must check in before checking out')
    }

    if (existingRecord.checkOut) {
      throw new Error('Already checked out today')
    }

    // Calculate duration
    const checkInTime = new Date(existingRecord.checkIn).getTime()
    const checkOutTime = timestamp.getTime()
    const durationHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)

    return this.update(existingRecord.id, {
      checkOut: timestamp,
      duration: Math.round(durationHours * 100) / 100,
      status: 'present'
    })
  }
}

// Payroll service implementation for payroll management
export class MockPayrollService implements DataService<PayrollData> {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getAll(): Promise<PayrollData[]> {
    await this.delay(400 + Math.random() * 200)
    // Generate mock payroll data based on current users
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    return mockUsers.map(user => ({
      id: `payroll_${user.id}_${currentYear}_${currentMonth}`,
      employeeId: user.id,
      salary: user.salary || 0,
      month: String(currentMonth + 1).padStart(2, '0'),
      year: currentYear,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  }

  async getById(id: string): Promise<PayrollData> {
    await this.delay(400 + Math.random() * 200)
    const allPayroll = await this.getAll()
    const payroll = allPayroll.find(p => p.id === id)
    if (!payroll) {
      throw new Error('Payroll record not found')
    }
    return payroll
  }

  async create(item: Omit<PayrollData, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayrollData> {
    await this.delay(500 + Math.random() * 300)
    const newPayroll: PayrollData = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    return newPayroll
  }

  async update(id: string, item: Partial<PayrollData>): Promise<PayrollData> {
    await this.delay(400 + Math.random() * 200)
    const existing = await this.getById(id)
    const updated = {
      ...existing,
      ...item,
      updatedAt: new Date()
    }
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.delay(300 + Math.random() * 200)
    // In a real implementation, this would delete from storage
  }
}

// Basic user service implementation for profile management
export class MockUserService implements DataService<User> {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getAll(): Promise<User[]> {
    await this.delay(400 + Math.random() * 200)
    return [...mockUsers]
  }

  async getById(id: string): Promise<User> {
    await this.delay(400 + Math.random() * 200)
    const user = mockUsers.find(u => u.id === id)
    if (!user) {
      throw new Error('User not found')
    }
    return { ...user }
  }

  async create(item: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    await this.delay(500 + Math.random() * 300)
    const newUser: User = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    mockUsers.push(newUser)
    return { ...newUser }
  }

  async update(id: string, item: Partial<User>): Promise<User> {
    await this.delay(400 + Math.random() * 200)
    const userIndex = mockUsers.findIndex(u => u.id === id)
    if (userIndex === -1) {
      throw new Error('User not found')
    }
    
    const updatedUser = {
      ...mockUsers[userIndex],
      ...item,
      updatedAt: new Date()
    }
    
    mockUsers[userIndex] = updatedUser
    return { ...updatedUser }
  }

  async delete(id: string): Promise<void> {
    await this.delay(300 + Math.random() * 200)
    const userIndex = mockUsers.findIndex(u => u.id === id)
    if (userIndex === -1) {
      throw new Error('User not found')
    }
    mockUsers.splice(userIndex, 1)
  }
}

// Leave service implementation for leave management
export class MockLeaveService implements LeaveService {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getAll(): Promise<LeaveRequest[]> {
    await this.delay(400 + Math.random() * 200)
    return [...mockLeaveRequests]
  }

  async getById(id: string): Promise<LeaveRequest> {
    await this.delay(400 + Math.random() * 200)
    const request = mockLeaveRequests.find(r => r.id === id)
    if (!request) {
      throw new Error('Leave request not found')
    }
    return { ...request }
  }

  async create(item: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<LeaveRequest> {
    await this.delay(500 + Math.random() * 300)
    const newRequest: LeaveRequest = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    mockLeaveRequests.push(newRequest)
    return { ...newRequest }
  }

  async update(id: string, item: Partial<LeaveRequest>): Promise<LeaveRequest> {
    await this.delay(400 + Math.random() * 200)
    const requestIndex = mockLeaveRequests.findIndex(r => r.id === id)
    if (requestIndex === -1) {
      throw new Error('Leave request not found')
    }
    
    const updatedRequest = {
      ...mockLeaveRequests[requestIndex],
      ...item,
      updatedAt: new Date()
    }
    
    mockLeaveRequests[requestIndex] = updatedRequest
    return { ...updatedRequest }
  }

  async delete(id: string): Promise<void> {
    await this.delay(300 + Math.random() * 200)
    const requestIndex = mockLeaveRequests.findIndex(r => r.id === id)
    if (requestIndex === -1) {
      throw new Error('Leave request not found')
    }
    mockLeaveRequests.splice(requestIndex, 1)
  }

  // Additional methods for leave management
  async getByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    await this.delay(400 + Math.random() * 200)
    return mockLeaveRequests.filter(r => r.employeeId === employeeId)
  }

  async approveRequest(id: string, adminComment?: string): Promise<LeaveRequest> {
    return this.update(id, { status: 'approved', adminComment })
  }

  async rejectRequest(id: string, adminComment?: string): Promise<LeaveRequest> {
    return this.update(id, { status: 'rejected', adminComment })
  }
}

// Service instances
export const userService = new MockUserService()
export const attendanceService = new MockAttendanceService()
export const leaveService = new MockLeaveService()
export const payrollService = new MockPayrollService()
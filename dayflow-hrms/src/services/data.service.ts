// Data service interface and implementation
// This will be implemented in task 13

import { DataService, User, AttendanceRecord, LeaveRequest, PayrollData } from '@/types'

export class MockDataService<T> implements DataService<T> {
  async getAll(): Promise<T[]> {
    // Implementation will be added in task 13
    throw new Error('Not implemented yet')
  }

  async getById(id: string): Promise<T> {
    // Implementation will be added in task 13
    throw new Error('Not implemented yet')
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    // Implementation will be added in task 13
    throw new Error('Not implemented yet')
  }

  async update(id: string, item: Partial<T>): Promise<T> {
    // Implementation will be added in task 13
    throw new Error('Not implemented yet')
  }

  async delete(id: string): Promise<void> {
    // Implementation will be added in task 13
    throw new Error('Not implemented yet')
  }
}

// Service instances that will be implemented in task 13
export const userService = new MockDataService<User>()
export const attendanceService = new MockDataService<AttendanceRecord>()
export const leaveService = new MockDataService<LeaveRequest>()
export const payrollService = new MockDataService<PayrollData>()
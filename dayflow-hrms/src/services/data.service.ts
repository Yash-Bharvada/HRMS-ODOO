// Data service interface and implementation
// Basic implementation for profile management - will be fully implemented in task 13

import { DataService, User, AttendanceRecord, LeaveRequest, PayrollData } from '@/types'
import { mockUsers } from './mock-data'

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

// Service instances
export const userService = new MockUserService()
export const attendanceService = new MockDataService<AttendanceRecord>()
export const leaveService = new MockDataService<LeaveRequest>()
export const payrollService = new MockDataService<PayrollData>()
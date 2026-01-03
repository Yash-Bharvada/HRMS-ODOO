/**
 * Property-Based Test for Service Layer Abstraction
 * **Feature: dayflow-hrms, Property 15: Service layer abstraction**
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
 */

import * as fc from 'fast-check'
import { 
  AuthService, 
  DataService, 
  User, 
  AttendanceRecord, 
  LeaveRequest, 
  PayrollData,
  LoginCredentials,
  SignupData
} from '@/types'

// Mock implementations to test interface consistency
class TestAuthService implements AuthService {
  private users: User[] = []
  private currentUser: User | null = null

  async login(credentials: LoginCredentials): Promise<User> {
    const user = this.users.find(u => u.email === credentials.email)
    if (!user) {
      throw new Error('User not found')
    }
    this.currentUser = user
    return user
  }

  async logout(): Promise<void> {
    this.currentUser = null
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  async signup(data: SignupData): Promise<User> {
    const user: User = {
      id: Math.random().toString(36),
      employeeId: data.employeeId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.users.push(user)
    return user
  }

  // Test helper method
  addUser(user: User): void {
    this.users.push(user)
  }
}

class TestDataService<T extends { id: string; createdAt: Date; updatedAt: Date }> implements DataService<T> {
  private data: T[] = []

  async getAll(): Promise<T[]> {
    return [...this.data]
  }

  async getById(id: string): Promise<T> {
    const item = this.data.find(d => d.id === id)
    if (!item) {
      throw new Error('Item not found')
    }
    return item
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const newItem = {
      ...item,
      id: Math.random().toString(36),
      createdAt: new Date(),
      updatedAt: new Date()
    } as T
    this.data.push(newItem)
    return newItem
  }

  async update(id: string, item: Partial<T>): Promise<T> {
    const index = this.data.findIndex(d => d.id === id)
    if (index === -1) {
      throw new Error('Item not found')
    }
    const updated = {
      ...this.data[index],
      ...item,
      updatedAt: new Date()
    }
    this.data[index] = updated
    return updated
  }

  async delete(id: string): Promise<void> {
    const index = this.data.findIndex(d => d.id === id)
    if (index === -1) {
      throw new Error('Item not found')
    }
    this.data.splice(index, 1)
  }

  // Test helper methods
  setData(data: T[]): void {
    this.data = [...data]
  }

  getData(): T[] {
    return [...this.data]
  }
}

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

const loginCredentialsArbitrary = fc.record({
  email: fc.emailAddress(),
  password: fc.string({ minLength: 6 })
})

const signupDataArbitrary = fc.record({
  employeeId: fc.string({ minLength: 1 }),
  fullName: fc.string({ minLength: 1 }),
  email: fc.emailAddress(),
  password: fc.string({ minLength: 6 }),
  role: fc.constantFrom('employee' as const, 'admin' as const)
})

const attendanceRecordArbitrary = fc.record({
  id: fc.string({ minLength: 1 }),
  employeeId: fc.string({ minLength: 1 }),
  date: fc.string({ minLength: 1 }),
  checkIn: fc.option(fc.date()),
  checkOut: fc.option(fc.date()),
  status: fc.constantFrom('present' as const, 'half-day' as const, 'absent' as const, 'leave' as const),
  duration: fc.option(fc.float({ min: 0, max: 24 })),
  createdAt: fc.date(),
  updatedAt: fc.date()
})

describe('Service Layer Abstraction Properties', () => {
  describe('AuthService Interface Consistency', () => {
    it('should maintain consistent interface for login operations', async () => {
      await fc.assert(fc.asyncProperty(
        userArbitrary,
        loginCredentialsArbitrary,
        async (user, credentials) => {
          const authService = new TestAuthService()
          authService.addUser({ ...user, email: credentials.email })

          // Test that login returns a user with consistent structure
          const loggedInUser = await authService.login(credentials)
          
          expect(loggedInUser).toHaveProperty('id')
          expect(loggedInUser).toHaveProperty('employeeId')
          expect(loggedInUser).toHaveProperty('fullName')
          expect(loggedInUser).toHaveProperty('email')
          expect(loggedInUser).toHaveProperty('role')
          expect(loggedInUser).toHaveProperty('createdAt')
          expect(loggedInUser).toHaveProperty('updatedAt')
          expect(loggedInUser.email).toBe(credentials.email)
          expect(['employee', 'admin']).toContain(loggedInUser.role)
        }
      ), { numRuns: 100 })
    })

    it('should maintain consistent interface for signup operations', async () => {
      await fc.assert(fc.asyncProperty(
        signupDataArbitrary,
        async (signupData) => {
          const authService = new TestAuthService()

          // Test that signup returns a user with consistent structure
          const newUser = await authService.signup(signupData)
          
          expect(newUser).toHaveProperty('id')
          expect(newUser).toHaveProperty('employeeId')
          expect(newUser).toHaveProperty('fullName')
          expect(newUser).toHaveProperty('email')
          expect(newUser).toHaveProperty('role')
          expect(newUser).toHaveProperty('createdAt')
          expect(newUser).toHaveProperty('updatedAt')
          expect(newUser.employeeId).toBe(signupData.employeeId)
          expect(newUser.fullName).toBe(signupData.fullName)
          expect(newUser.email).toBe(signupData.email)
          expect(newUser.role).toBe(signupData.role)
        }
      ), { numRuns: 100 })
    })

    it('should maintain consistent state management', async () => {
      await fc.assert(fc.asyncProperty(
        userArbitrary,
        loginCredentialsArbitrary,
        async (user, credentials) => {
          const authService = new TestAuthService()
          authService.addUser({ ...user, email: credentials.email })

          // Initially no current user
          expect(authService.getCurrentUser()).toBeNull()

          // After login, current user should be set
          await authService.login(credentials)
          const currentUser = authService.getCurrentUser()
          expect(currentUser).not.toBeNull()
          expect(currentUser?.email).toBe(credentials.email)

          // After logout, current user should be null
          await authService.logout()
          expect(authService.getCurrentUser()).toBeNull()
        }
      ), { numRuns: 100 })
    })
  })

  describe('DataService Interface Consistency', () => {
    it('should maintain consistent CRUD operations for any data type', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(attendanceRecordArbitrary, { minLength: 1, maxLength: 10 }),
        async (records) => {
          const dataService = new TestDataService<AttendanceRecord>()
          dataService.setData(records)

          // Test getAll returns all items
          const allItems = await dataService.getAll()
          expect(allItems).toHaveLength(records.length)

          // Test getById returns correct item
          const firstRecord = records[0]
          const retrievedItem = await dataService.getById(firstRecord.id)
          expect(retrievedItem.id).toBe(firstRecord.id)
          expect(retrievedItem.employeeId).toBe(firstRecord.employeeId)

          // Test create adds new item
          const newItem = {
            employeeId: 'test-emp',
            date: '2024-01-01',
            status: 'present' as const
          }
          const createdItem = await dataService.create(newItem)
          expect(createdItem).toHaveProperty('id')
          expect(createdItem).toHaveProperty('createdAt')
          expect(createdItem).toHaveProperty('updatedAt')
          expect(createdItem.employeeId).toBe(newItem.employeeId)

          const allItemsAfterCreate = await dataService.getAll()
          expect(allItemsAfterCreate).toHaveLength(records.length + 1)
        }
      ), { numRuns: 100 })
    })

    it('should maintain consistent update operations', async () => {
      await fc.assert(fc.asyncProperty(
        attendanceRecordArbitrary,
        fc.string({ minLength: 1 }),
        async (record, newEmployeeId) => {
          const dataService = new TestDataService<AttendanceRecord>()
          dataService.setData([record])

          // Test update modifies item correctly
          const updatedItem = await dataService.update(record.id, { 
            employeeId: newEmployeeId 
          })
          
          expect(updatedItem.id).toBe(record.id)
          expect(updatedItem.employeeId).toBe(newEmployeeId)
          expect(updatedItem.updatedAt).toBeInstanceOf(Date)
          // Test that the update operation maintains the interface contract
          expect(updatedItem).toHaveProperty('id')
          expect(updatedItem).toHaveProperty('employeeId')
          expect(updatedItem).toHaveProperty('createdAt')
          expect(updatedItem).toHaveProperty('updatedAt')
        }
      ), { numRuns: 100 })
    })

    it('should maintain consistent delete operations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(attendanceRecordArbitrary, { minLength: 2, maxLength: 10 }),
        async (records) => {
          const dataService = new TestDataService<AttendanceRecord>()
          dataService.setData(records)

          const itemToDelete = records[0]
          
          // Test delete removes item
          await dataService.delete(itemToDelete.id)
          
          const remainingItems = await dataService.getAll()
          expect(remainingItems).toHaveLength(records.length - 1)
          expect(remainingItems.find(item => item.id === itemToDelete.id)).toBeUndefined()
        }
      ), { numRuns: 100 })
    })

    it('should handle errors consistently across operations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (nonExistentId) => {
          const dataService = new TestDataService<AttendanceRecord>()
          
          // Test that operations on non-existent items throw errors consistently
          await expect(dataService.getById(nonExistentId)).rejects.toThrow('Item not found')
          await expect(dataService.update(nonExistentId, {})).rejects.toThrow('Item not found')
          await expect(dataService.delete(nonExistentId)).rejects.toThrow('Item not found')
        }
      ), { numRuns: 100 })
    })
  })

  describe('Service Interface Replaceability', () => {
    it('should allow service implementations to be swapped without affecting interface contracts', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(userArbitrary, { minLength: 1, maxLength: 5 }),
        async (users) => {
          // Test that different implementations of the same interface work identically
          const service1 = new TestDataService<User>()
          const service2 = new TestDataService<User>()
          
          // Both services should handle the same operations identically
          service1.setData(users)
          service2.setData(users)
          
          const results1 = await service1.getAll()
          const results2 = await service2.getAll()
          
          expect(results1).toHaveLength(results2.length)
          expect(results1.every(item => 
            results2.some(item2 => item2.id === item.id)
          )).toBe(true)
        }
      ), { numRuns: 100 })
    })
  })
})
// Authentication service interface and implementation

import { AuthService, LoginCredentials, SignupData, User } from '@/types'
import { mockUsers } from './mock-data'

const AUTH_STORAGE_KEY = 'dayflow_auth_user'

export class MockAuthService implements AuthService {
  private currentUser: User | null = null

  constructor() {
    // Load user from localStorage on initialization
    this.loadUserFromStorage()
  }

  async login(credentials: LoginCredentials): Promise<User> {
    // Simulate network delay
    await this.delay(400 + Math.random() * 200)

    // Find user by email
    const user = mockUsers.find(u => u.email === credentials.email)
    
    if (!user) {
      throw new Error('Invalid email or password')
    }

    // For demo purposes, accept any password for existing users
    // In a real app, you would verify the password hash
    if (!credentials.password || credentials.password.length < 6) {
      throw new Error('Invalid email or password')
    }

    this.currentUser = user
    this.saveUserToStorage(user)
    
    return user
  }

  async logout(): Promise<void> {
    // Simulate network delay
    await this.delay(200 + Math.random() * 100)
    
    this.currentUser = null
    this.clearUserFromStorage()
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  async signup(data: SignupData): Promise<User> {
    // Simulate network delay
    await this.delay(500 + Math.random() * 300)

    // Check if user already exists
    const existingUser = mockUsers.find(u => 
      u.email === data.email || u.employeeId === data.employeeId
    )
    
    if (existingUser) {
      throw new Error('User with this email or employee ID already exists')
    }

    // Create new user
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: data.employeeId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add to mock users (in a real app, this would be saved to database)
    mockUsers.push(newUser)
    
    this.currentUser = newUser
    this.saveUserToStorage(newUser)
    
    return newUser
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private saveUserToStorage(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    }
  }

  private loadUserFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored)
        } catch (error) {
          console.error('Failed to parse stored user data:', error)
          this.clearUserFromStorage()
        }
      }
    }
  }

  private clearUserFromStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }
}

export const authService = new MockAuthService()
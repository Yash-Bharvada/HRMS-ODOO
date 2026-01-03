// Authentication service interface and implementation
// This will be implemented in task 3

import { AuthService, LoginCredentials, SignupData, User } from '@/types'

export class MockAuthService implements AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    // Implementation will be added in task 3
    throw new Error('Not implemented yet')
  }

  async logout(): Promise<void> {
    // Implementation will be added in task 3
    throw new Error('Not implemented yet')
  }

  getCurrentUser(): User | null {
    // Implementation will be added in task 3
    return null
  }

  async signup(data: SignupData): Promise<User> {
    // Implementation will be added in task 3
    throw new Error('Not implemented yet')
  }
}

export const authService = new MockAuthService()
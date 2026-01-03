// Authentication service implementation using backend API
import { AuthService, LoginCredentials, SignupData, User } from '@/types'
import { apiService } from './api.service'

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export class BackendAuthService implements AuthService {
  private currentUser: User | null = null;

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiService.post<AuthResponse>('/authentication/login', {
        email: credentials.email,
        password: credentials.password,
      });

      // Store tokens
      apiService.setToken(response.accessToken);
      localStorage.setItem('refresh_token', response.refreshToken);
      
      // Store user
      this.currentUser = response.user;
      localStorage.setItem('current_user', JSON.stringify(response.user));

      return response.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid email or password');
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiService.post('/authentication/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      apiService.setToken(null);
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('current_user');
      this.currentUser = null;
    }
  }

  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser);
          return this.currentUser;
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('current_user');
        }
      }
    }
    
    return null;
  }

  async signup(data: SignupData): Promise<User> {
    try {
      const response = await apiService.post<AuthResponse>('/authentication/signup', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone,
        address: data.address,
      });

      // Store tokens
      apiService.setToken(response.accessToken);
      localStorage.setItem('refresh_token', response.refreshToken);
      
      // Store user
      this.currentUser = response.user;
      localStorage.setItem('current_user', JSON.stringify(response.user));

      return response.user;
    } catch (error) {
      console.error('Signup failed:', error);
      throw new Error('Failed to create account');
    }
  }
}

export const authService = new BackendAuthService();

// HTTP client service for API communication with the backend
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private refreshPromise: Promise<void> | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // Base delay in ms

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.baseUrl}/authentication/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        this.setToken(data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('current_user', JSON.stringify(data.user));
      } catch (error) {
        // Clear tokens on refresh failure
        this.setToken(null);
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_user');
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private createApiError(error: any, status?: number): ApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
        status,
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        status,
      };
    }

    return {
      message: error?.message || 'An unexpected error occurred',
      status,
      code: error?.code,
      details: error?.details,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let token = this.getToken();

    const makeRequest = async (authToken?: string): Promise<T> => {
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          ...options.headers,
        },
        ...options,
      };

      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          if (response.status === 401 && authToken && !endpoint.includes('/authentication/')) {
            // Token might be expired, try to refresh
            throw new Error('UNAUTHORIZED');
          }
          
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: `HTTP error! status: ${response.status}` };
          }
          
          throw this.createApiError(errorData, response.status);
        }

        return response.json();
      } catch (error) {
        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw this.createApiError('Network error. Please check your connection.', 0);
        }
        throw error;
      }
    };

    try {
      return await makeRequest(token || undefined);
    } catch (error: any) {
      // Handle unauthorized errors with token refresh
      if (error.message === 'UNAUTHORIZED') {
        try {
          await this.refreshToken();
          token = this.getToken();
          return await makeRequest(token || undefined);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw this.createApiError('Authentication failed. Please login again.', 401);
        }
      }

      // Handle retryable errors (network issues, 5xx errors)
      const shouldRetry = (
        retryCount < this.maxRetries &&
        (error.status === 0 || (error.status >= 500 && error.status < 600))
      );

      if (shouldRetry) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.warn(`Request failed, retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.maxRetries})`);
        await this.sleep(delay);
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();
// Global error handling utilities

export interface AppError extends Error {
  code?: string
  statusCode?: number
  retryable?: boolean
}

export class NetworkError extends Error implements AppError {
  code = 'NETWORK_ERROR'
  statusCode = 0
  retryable = true

  constructor(message = 'Network request failed') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR'
  statusCode = 400
  retryable = false

  constructor(message = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error implements AppError {
  code = 'AUTH_ERROR'
  statusCode = 401
  retryable = false

  constructor(message = 'Authentication failed') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class NotFoundError extends Error implements AppError {
  code = 'NOT_FOUND'
  statusCode = 404
  retryable = false

  constructor(message = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ServerError extends Error implements AppError {
  code = 'SERVER_ERROR'
  statusCode = 500
  retryable = true

  constructor(message = 'Internal server error') {
    super(message)
    this.name = 'ServerError'
  }
}

// Error classification
export function classifyError(error: unknown): AppError {
  if (error && typeof error === 'object' && 'code' in error && 'statusCode' in error) {
    return error as AppError
  }

  if (error instanceof Error) {
    // Network-related errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new NetworkError(error.message)
    }

    // Validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return new ValidationError(error.message)
    }

    // Authentication errors
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return new AuthenticationError(error.message)
    }

    // Not found errors
    if (error.message.includes('not found')) {
      return new NotFoundError(error.message)
    }

    // Default to server error
    return new ServerError(error.message)
  }

  // Unknown error type
  return new ServerError('An unknown error occurred')
}

// Retry mechanism
export interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: boolean
  retryCondition?: (error: AppError) => boolean
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    retryCondition = (error) => error.retryable ?? false
  } = options

  let lastError: AppError

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = classifyError(error)

      // Don't retry on last attempt or if error is not retryable
      if (attempt === maxAttempts || !retryCondition(lastError)) {
        throw lastError
      }

      // Calculate delay with optional backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay
      await new Promise(resolve => setTimeout(resolve, currentDelay))
    }
  }

  throw lastError!
}

// Error logging
export function logError(error: AppError, context?: Record<string, any>) {
  const errorData = {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', errorData)
  } else {
    // In production, you would send this to your error tracking service
    console.error('Error:', error.message)
  }
}

// User-friendly error messages
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Unable to connect to the server. Please check your internet connection and try again.'
    case 'VALIDATION_ERROR':
      return error.message || 'Please check your input and try again.'
    case 'AUTH_ERROR':
      return 'Your session has expired. Please log in again.'
    case 'NOT_FOUND':
      return 'The requested information could not be found.'
    case 'SERVER_ERROR':
      return 'A server error occurred. Please try again later.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const error = classifyError(event.reason)
      logError(error, { type: 'unhandledrejection' })
      
      // Prevent the default browser error handling
      event.preventDefault()
    })

    window.addEventListener('error', (event) => {
      const error = classifyError(event.error)
      logError(error, { 
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })
  }
}
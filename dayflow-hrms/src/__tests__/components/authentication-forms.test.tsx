import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { LoginPage } from '@/components/pages/login-page'
import { SignupPage } from '@/components/pages/signup-page'
import { useAuth } from '@/contexts/auth-context'
import { authService } from '@/services/auth.service'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn()
}))

// Mock auth service
jest.mock('@/services/auth.service', () => ({
  authService: {
    signup: jest.fn()
  }
}))

const mockPush = jest.fn()
const mockLogin = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({
    push: mockPush
  })
  ;(useAuth as jest.Mock).mockReturnValue({
    login: mockLogin
  })
})

describe('LoginPage', () => {
  it('should render login form with all required fields', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Dayflow HRMS')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
  })

  it('should display validation errors for empty fields', async () => {
    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('should display validation error for invalid email', async () => {
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.submit(screen.getByRole('form'))
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('should display validation error for short password', async () => {
    render(<LoginPage />)
    
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('should clear field errors when user starts typing', async () => {
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    // Trigger validation error
    fireEvent.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
    
    // Start typing to clear error
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument()
    })
  })

  it('should call login function with correct credentials on valid submission', async () => {
    mockLogin.mockResolvedValue(undefined)
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('should display authentication error when login fails', async () => {
    const errorMessage = 'Invalid email or password'
    mockLogin.mockRejectedValue(new Error(errorMessage))
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('should navigate to dashboard on successful login', async () => {
    mockLogin.mockResolvedValue(undefined)
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should disable form during submission', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })
})

describe('SignupPage', () => {
  it('should render signup form with all required fields', () => {
    render(<SignupPage />)
    
    expect(screen.getByText('Dayflow HRMS')).toBeInTheDocument()
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Employee ID')).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Role')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.getByText('Already have an account?')).toBeInTheDocument()
  })

  it('should display validation errors for empty required fields', async () => {
    render(<SignupPage />)
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Employee ID is required')).toBeInTheDocument()
      expect(screen.getByText('Full name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('should display validation errors for invalid field lengths', async () => {
    render(<SignupPage />)
    
    const employeeIdInput = screen.getByLabelText('Employee ID')
    const fullNameInput = screen.getByLabelText('Full Name')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    
    fireEvent.change(employeeIdInput, { target: { value: 'AB' } })
    fireEvent.change(fullNameInput, { target: { value: 'A' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Employee ID must be at least 3 characters')).toBeInTheDocument()
      expect(screen.getByText('Full name must be at least 2 characters')).toBeInTheDocument()
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('should display validation error for invalid email format', async () => {
    render(<SignupPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.submit(screen.getByRole('form'))
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('should call signup service with correct data on valid submission', async () => {
    const mockUser = {
      id: '1',
      employeeId: 'EMP001',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'employee' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    ;(authService.signup as jest.Mock).mockResolvedValue(mockUser)
    
    render(<SignupPage />)
    
    const employeeIdInput = screen.getByLabelText('Employee ID')
    const fullNameInput = screen.getByLabelText('Full Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const roleSelect = screen.getByLabelText('Role')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    
    fireEvent.change(employeeIdInput, { target: { value: 'EMP001' } })
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(roleSelect, { target: { value: 'employee' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(authService.signup).toHaveBeenCalledWith({
        employeeId: 'EMP001',
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'employee'
      })
    })
  })

  it('should navigate to employee dashboard for employee role', async () => {
    const mockUser = {
      id: '1',
      employeeId: 'EMP001',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'employee' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    ;(authService.signup as jest.Mock).mockResolvedValue(mockUser)
    
    render(<SignupPage />)
    
    const employeeIdInput = screen.getByLabelText('Employee ID')
    const fullNameInput = screen.getByLabelText('Full Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    
    fireEvent.change(employeeIdInput, { target: { value: 'EMP001' } })
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/employee')
    })
  })

  it('should navigate to admin dashboard for admin role', async () => {
    const mockUser = {
      id: '1',
      employeeId: 'ADM001',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      role: 'admin' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    ;(authService.signup as jest.Mock).mockResolvedValue(mockUser)
    
    render(<SignupPage />)
    
    const employeeIdInput = screen.getByLabelText('Employee ID')
    const fullNameInput = screen.getByLabelText('Full Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const roleSelect = screen.getByLabelText('Role')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    
    fireEvent.change(employeeIdInput, { target: { value: 'ADM001' } })
    fireEvent.change(fullNameInput, { target: { value: 'Jane Smith' } })
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(roleSelect, { target: { value: 'admin' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/admin')
    })
  })

  it('should display authentication error when signup fails', async () => {
    const errorMessage = 'User with this email already exists'
    ;(authService.signup as jest.Mock).mockRejectedValue(new Error(errorMessage))
    
    render(<SignupPage />)
    
    const employeeIdInput = screen.getByLabelText('Employee ID')
    const fullNameInput = screen.getByLabelText('Full Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    
    fireEvent.change(employeeIdInput, { target: { value: 'EMP001' } })
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('should clear authentication error when user modifies form', async () => {
    const errorMessage = 'User with this email already exists'
    ;(authService.signup as jest.Mock).mockRejectedValue(new Error(errorMessage))
    
    render(<SignupPage />)
    
    const employeeIdInput = screen.getByLabelText('Employee ID')
    const fullNameInput = screen.getByLabelText('Full Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    
    // Fill form and submit to trigger error
    fireEvent.change(employeeIdInput, { target: { value: 'EMP001' } })
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
    
    // Modify form to clear error
    fireEvent.change(emailInput, { target: { value: 'john2@example.com' } })
    
    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument()
    })
  })

  it('should disable form during submission', async () => {
    ;(authService.signup as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(<SignupPage />)
    
    const employeeIdInput = screen.getByLabelText('Employee ID')
    const fullNameInput = screen.getByLabelText('Full Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const roleSelect = screen.getByLabelText('Role')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    
    fireEvent.change(employeeIdInput, { target: { value: 'EMP001' } })
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    expect(employeeIdInput).toBeDisabled()
    expect(fullNameInput).toBeDisabled()
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(roleSelect).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })
})
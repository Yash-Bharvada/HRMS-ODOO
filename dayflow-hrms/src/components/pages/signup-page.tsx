'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'
import { SignupData } from '@/types'

interface SignupErrors {
  employeeId?: string
  fullName?: string
  email?: string
  password?: string
  role?: string
}

export function SignupPage() {
  const [formData, setFormData] = useState<SignupData>({
    employeeId: '',
    fullName: '',
    email: '',
    password: '',
    role: 'employee'
  })
  const [errors, setErrors] = useState<SignupErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string>('')

  const router = useRouter()

  const validateForm = (): boolean => {
    const newErrors: SignupErrors = {}

    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee ID is required'
    } else if (formData.employeeId.length < 3) {
      newErrors.employeeId = 'Employee ID must be at least 3 characters'
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.role) {
      newErrors.role = 'Role selection is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const user = await authService.signup(formData)
      
      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/dashboard/admin')
      } else {
        router.push('/dashboard/employee')
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Signup failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof SignupData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
    
    // Clear auth error when user modifies form
    if (authError) {
      setAuthError('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Dayflow HRMS</h1>
          <p className="mt-2 text-muted-foreground">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" role="form">
          {authError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {authError}
            </div>
          )}

          <Input
            label="Employee ID"
            type="text"
            value={formData.employeeId}
            onChange={handleInputChange('employeeId')}
            error={errors.employeeId}
            placeholder="Enter your employee ID"
            disabled={isSubmitting}
          />

          <Input
            label="Full Name"
            type="text"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            error={errors.fullName}
            placeholder="Enter your full name"
            disabled={isSubmitting}
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            placeholder="Enter your email"
            disabled={isSubmitting}
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={errors.password}
            placeholder="Create a password (6+ characters)"
            disabled={isSubmitting}
          />

          <div className="space-y-2">
            <label htmlFor="role-select" className="text-sm font-medium leading-none">
              Role
            </label>
            <select
              id="role-select"
              value={formData.role}
              onChange={handleInputChange('role')}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="employee">Employee</option>
              <option value="admin">HR Administrator</option>
            </select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Create Account
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
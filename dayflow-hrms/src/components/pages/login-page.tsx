'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { LoginCredentials } from '@/types'

export function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string>('')

  const { login } = useAuth()
  const router = useRouter()

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginCredentials> = {}

    if (!credentials.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!credentials.password) {
      newErrors.password = 'Password is required'
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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
      await login(credentials)
      // Navigation will be handled by the auth context and route protection
      router.push('/dashboard')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
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
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" role="form">
          {authError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {authError}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={credentials.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            placeholder="Enter your email"
            disabled={isSubmitting}
          />

          <Input
            label="Password"
            type="password"
            value={credentials.password}
            onChange={handleInputChange('password')}
            error={errors.password}
            placeholder="Enter your password"
            disabled={isSubmitting}
          />

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              href="/signup" 
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo credentials helper */}
        <div className="mt-8 p-4 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground mb-2">Demo Credentials:</p>
          <div className="text-xs space-y-1">
            <p><strong>Employee:</strong> john.doe@company.com</p>
            <p><strong>Admin:</strong> jane.smith@company.com</p>
            <p><strong>Password:</strong> Any password (6+ chars)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
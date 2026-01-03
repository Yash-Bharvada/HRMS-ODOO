// Authentication context

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthContextType, LoginCredentials, User } from '@/types'
import { authService } from '@/services/auth.service'
import { classifyError, getUserFriendlyMessage, logError } from '@/utils/error-handler'
import { useToast } from '@/components/ui/toast'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { error: showError, success: showSuccess } = useToast()

  // Initialize auth state on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true)
    try {
      const loggedInUser = await authService.login(credentials)
      setUser(loggedInUser)
      showSuccess('Login successful', `Welcome back, ${loggedInUser.fullName}!`)
    } catch (error) {
      const appError = classifyError(error)
      logError(appError, { action: 'login' })
      showError('Login failed', getUserFriendlyMessage(appError))
      throw appError
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
      showSuccess('Logged out', 'You have been successfully logged out')
    } catch (error) {
      const appError = classifyError(error)
      logError(appError, { action: 'logout' })
      // Even if logout fails, clear the user state
      setUser(null)
      showError('Logout warning', 'There was an issue logging out, but you have been signed out locally')
    } finally {
      setIsLoading(false)
    }
  }

  const isAuthenticated = user !== null

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
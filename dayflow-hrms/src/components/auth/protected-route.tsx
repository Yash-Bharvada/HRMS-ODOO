'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: ('EMPLOYEE' | 'ADMIN')[]
  requiredRole?: 'EMPLOYEE' | 'ADMIN'
  fallback?: ReactNode
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  // If not authenticated, show fallback or redirect message
  if (!user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            Please log in to access this page.
          </p>
        </div>
      </div>
    )
  }

  // Check role-based access
  const roleToCheck = requiredRole || (allowedRoles && allowedRoles[0])
  if (roleToCheck && user.role !== roleToCheck) {
    // If allowedRoles is provided, check if user role is in the allowed list
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Insufficient Permissions
            </h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Required role: {allowedRoles.join(' or ')}, Your role: {user.role}
            </p>
          </div>
        </div>
      )
    }
    
    // If requiredRole is provided and doesn't match
    if (requiredRole && user.role !== requiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Insufficient Permissions
            </h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Required role: {requiredRole}, Your role: {user.role}
            </p>
          </div>
        </div>
      )
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LoginPage } from '@/components/pages/login-page'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user role
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner text="Loading..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  // This should not be reached due to the useEffect redirect above
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner text="Redirecting..." />
    </div>
  )
}

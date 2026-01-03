'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function EmployeesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to admin dashboard where employee management is located
    router.replace('/admin')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner />
    </div>
  )
}
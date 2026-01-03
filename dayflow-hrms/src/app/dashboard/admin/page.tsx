'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function DashboardAdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the correct admin route
    router.replace('/admin')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner text="Redirecting to admin dashboard..." />
    </div>
  )
}
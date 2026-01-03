'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { AdminDashboard } from '@/components/pages/admin-dashboard'

export default function AdminPage() {
  return (
    <AppLayout 
      title="Admin Dashboard" 
      requiredRole="admin"
    >
      <AdminDashboard />
    </AppLayout>
  )
}
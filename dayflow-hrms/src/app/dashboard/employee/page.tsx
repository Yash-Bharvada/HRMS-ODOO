'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { EmployeeDashboard } from '@/components/pages/employee-dashboard'

export default function EmployeeDashboardPage() {
  return (
    <AppLayout 
      title="Employee Dashboard" 
      requiredRole="employee"
    >
      <EmployeeDashboard />
    </AppLayout>
  )
}
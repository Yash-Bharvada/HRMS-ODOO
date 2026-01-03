'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { PayrollPage } from '@/components/pages/payroll-page'

export default function Payroll() {
  return (
    <AppLayout 
      title="Payroll"
    >
      <PayrollPage />
    </AppLayout>
  )
}
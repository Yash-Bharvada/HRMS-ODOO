'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { LeavePage } from '@/components/pages/leave-page'

export default function Leave() {
  return (
    <AppLayout 
      title="Leave Management"
    >
      <LeavePage />
    </AppLayout>
  )
}
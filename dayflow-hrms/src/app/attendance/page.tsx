'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { AttendancePage } from '@/components/pages/attendance-page'

export default function Attendance() {
  return (
    <AppLayout 
      title="Attendance"
    >
      <AttendancePage />
    </AppLayout>
  )
}
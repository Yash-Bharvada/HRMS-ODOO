'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { ProfilePage } from '@/components/pages/profile-page'

export default function Profile() {
  return (
    <AppLayout 
      title="Profile"
    >
      <ProfilePage />
    </AppLayout>
  )
}
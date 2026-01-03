'use client'

import React, { useState } from 'react'
import { Sidebar } from './sidebar'
import { Navbar } from './navbar'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { clsx } from 'clsx'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  requiredRole?: 'employee' | 'admin'
  currentPath?: string
  onNavigate?: (href: string) => void
}

export function AppLayout({ 
  children, 
  title,
  requiredRole,
  currentPath,
  onNavigate
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <Sidebar 
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navbar */}
          <Navbar 
            title={title}
            onMenuClick={handleMenuClick}
            showMenuButton={true}
          />

          {/* Page content */}
          <main className="flex-1 overflow-auto bg-background p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { clsx } from 'clsx'
import { Bell, Settings, Menu } from 'lucide-react'

interface NavbarProps {
  title?: string
  onMenuClick?: () => void
  showMenuButton?: boolean
  className?: string
}

export function Navbar({ 
  title = 'Dashboard', 
  onMenuClick, 
  showMenuButton = false,
  className 
}: NavbarProps) {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className={clsx(
      'bg-card border-b border-border px-6 py-4',
      className
    )}>
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-2xl font-semibold text-card-foreground">
            {title}
          </h1>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {/* Notification badge - could be dynamic */}
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"></span>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User info */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-card-foreground">
                {user.fullName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
            
            {/* User avatar placeholder */}
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Logout button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
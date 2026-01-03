'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { clsx } from 'clsx'
import { Bell, Settings, Menu, User, LogOut, Moon, Sun, Palette } from 'lucide-react'

interface NavbarProps {
  title?: string
  onMenuClick?: () => void
  showMenuButton?: boolean
  className?: string
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Leave Request Approved',
    message: 'Your leave request for Feb 15-16 has been approved',
    time: '2 hours ago',
    read: false
  },
  {
    id: '2',
    title: 'Payroll Update',
    message: 'February payroll has been processed',
    time: '1 day ago',
    read: false
  },
  {
    id: '3',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Sunday 2-4 AM',
    time: '2 days ago',
    read: true
  }
]

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
  const router = useRouter()
  const { success, info } = useToast()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)
  
  const notificationRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const handleNotificationClick = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  const handleSettingsClick = (setting: string) => {
    setShowSettings(false)
    info('Settings', `${setting} clicked - feature coming soon!`)
  }

  const unreadCount = notifications.filter(n => !n.read).length

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
          <div className="relative" ref={notificationRef}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <h3 className="font-semibold text-card-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                        success('Notifications', 'All notifications marked as read')
                      }}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={clsx(
                          'p-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-accent transition-colors',
                          !notification.read && 'bg-accent/50'
                        )}
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-card-foreground text-sm">
                              {notification.title}
                            </h4>
                            <p className="text-muted-foreground text-sm mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full ml-2 mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="relative" ref={settingsRef}>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* Settings Dropdown */}
            {showSettings && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <button 
                    onClick={() => handleSettingsClick('Dark Mode')}
                    className="w-full flex items-center px-3 py-2 text-sm text-card-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    <Moon className="h-4 w-4 mr-3" />
                    Dark Mode
                  </button>
                  <button 
                    onClick={() => handleSettingsClick('Theme Settings')}
                    className="w-full flex items-center px-3 py-2 text-sm text-card-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    <Palette className="h-4 w-4 mr-3" />
                    Theme Settings
                  </button>
                  <button 
                    onClick={() => handleSettingsClick('Notification Settings')}
                    className="w-full flex items-center px-3 py-2 text-sm text-card-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    <Bell className="h-4 w-4 mr-3" />
                    Notification Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User info and menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 hover:bg-accent px-3 py-2 rounded-md transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-card-foreground">
                  {user.fullName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </p>
              </div>
              
              {/* User avatar */}
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <button 
                    onClick={() => {
                      setShowUserMenu(false)
                      router.push('/profile')
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-card-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    <User className="h-4 w-4 mr-3" />
                    View Profile
                  </button>
                  <div className="border-t border-border my-1"></div>
                  <button 
                    onClick={() => {
                      setShowUserMenu(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
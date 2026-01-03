'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { clsx } from 'clsx'
import { 
  Home, 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  User,
  LogOut
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: ('employee' | 'admin')[]
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['employee', 'admin']
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    roles: ['employee', 'admin']
  },
  {
    name: 'Attendance',
    href: '/attendance',
    icon: Clock,
    roles: ['employee', 'admin']
  },
  {
    name: 'Leave',
    href: '/leave',
    icon: Calendar,
    roles: ['employee', 'admin']
  },
  {
    name: 'Payroll',
    href: '/payroll',
    icon: DollarSign,
    roles: ['employee', 'admin']
  },
  {
    name: 'Employees',
    href: '/employees',
    icon: Users,
    roles: ['admin']
  }
]

interface SidebarProps {
  currentPath?: string
  onNavigate?: (href: string) => void
}

export function Sidebar({ currentPath = '', onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(user.role)
  )

  const handleNavigation = (href: string) => {
    if (onNavigate) {
      onNavigate(href)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo/Brand */}
      <div className="flex items-center px-6 py-4 border-b border-border">
        <h1 className="text-xl font-bold text-card-foreground">
          Dayflow HRMS
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.href
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={clsx(
                'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-card-foreground hover:bg-accent'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </button>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center px-3 py-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">
              {user.fullName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className={clsx(
            'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}
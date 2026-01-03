'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { clsx } from 'clsx'
import { 
  Home, 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
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
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  if (!user) {
    return null
  }

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(user.role)
  )

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className={clsx(
      "flex flex-col h-full bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo/Brand */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-card-foreground">
            Dayflow HRMS
          </h1>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1 rounded-md hover:bg-accent transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
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
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={clsx("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && item.name}
            </button>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-border">
        {!isCollapsed && (
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
        )}
        
        <button
          onClick={handleLogout}
          className={clsx(
            'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className={clsx("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Logout"}
        </button>
      </div>
    </div>
  )
}
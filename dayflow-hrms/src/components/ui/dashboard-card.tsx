import React from 'react'
import { clsx } from 'clsx'
import { DashboardCardProps } from '../../types'

export function DashboardCard({
  title,
  value,
  icon: Icon,
  onClick,
  className
}: DashboardCardProps) {
  const CardComponent = onClick ? 'button' : 'div'
  
  return (
    <CardComponent
      className={clsx(
        'bg-card border border-border rounded-lg p-6 transition-colors',
        onClick && 'hover:bg-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold text-card-foreground">
            {value}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-primary" />
        </div>
      </div>
    </CardComponent>
  )
}
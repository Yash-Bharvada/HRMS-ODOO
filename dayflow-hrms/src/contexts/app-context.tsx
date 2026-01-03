// Application context for global state
// This will be implemented in task 13

'use client'

import { createContext, useContext } from 'react'
import { AppContextType } from '@/types'

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Implementation will be added in task 13
  return (
    <AppContext.Provider value={undefined}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
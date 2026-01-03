// Authentication context
// This will be implemented in task 3

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthContextType, LoginCredentials, SignupData, User } from "@/types";
import { authService } from "@/services/auth.service";

import { createContext, useContext } from 'react'
import { AuthContextType } from '@/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Implementation will be added in task 3
  return (
    <AuthContext.Provider value={undefined}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

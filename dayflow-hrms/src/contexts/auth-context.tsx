"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthContextType, LoginCredentials, SignupData, User } from "@/types";
import { authService } from "@/services/auth.service";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingUser = authService.getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const loggedIn = await authService.login(credentials);
    setUser(loggedIn);
  };

  const signup = async (data: SignupData) => {
    const registered = await authService.signup(data);
    setUser(registered);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType & {
    signup?: (data: SignupData) => Promise<void>;
  } = useMemo(
    () => ({
      user,
      login,
      logout,
      isLoading,
      isAuthenticated: Boolean(user),
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

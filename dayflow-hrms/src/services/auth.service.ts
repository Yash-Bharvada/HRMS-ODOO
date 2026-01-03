// Authentication service interface and mock implementation

import { AuthService, LoginCredentials, SignupData, User } from "@/types";
import { mockUsers } from "./mock-data";
import {
  getFromStorage,
  setToStorage,
  removeFromStorage,
} from "@/utils/storage";

const STORAGE_KEY = "dayflow:currentUser";

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function reviveUser(user: User): User {
  return {
    ...user,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}

export class MockAuthService implements AuthService {
  private currentUser: User | null = null;

  private persist(user: User | null) {
    this.currentUser = user;
    if (user) {
      setToStorage(STORAGE_KEY, user);
    } else {
      removeFromStorage(STORAGE_KEY);
    }
  }

  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;

    const stored = getFromStorage<User>(STORAGE_KEY);
    if (stored) {
      this.currentUser = reviveUser(stored);
    }

    return this.currentUser;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    const user = mockUsers.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!credentials.password || credentials.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const authenticatedUser = reviveUser(user);
    this.persist(authenticatedUser);
    return authenticatedUser;
  }

  async logout(): Promise<void> {
    this.persist(null);
  }

  async signup(data: SignupData): Promise<User> {
    const existing = mockUsers.find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );

    if (existing) {
      throw new Error("Email already registered");
    }

    const now = new Date();
    const newUser: User = {
      id: generateId("user"),
      employeeId: data.employeeId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      createdAt: now,
      updatedAt: now,
    };

    mockUsers.push(newUser);
    this.persist(newUser);
    return newUser;
  }
}

export const authService = new MockAuthService();

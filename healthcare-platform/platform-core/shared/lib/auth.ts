// Authentication utilities for patient records access
import { createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'healthcare_provider' | 'admin';
  dateOfBirth?: string;
  patientId?: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  role: 'patient' | 'healthcare_provider';
  patientId?: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Local storage keys
const AUTH_STORAGE_KEY = 'healthcare_auth_user';
const USERS_STORAGE_KEY = 'healthcare_registered_users';

// Utility functions for local storage (in a real app, this would be a backend API)
export const authStorage = {
  // Get current authenticated user
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const userData = localStorage.getItem(AUTH_STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  // Set current authenticated user
  setCurrentUser(user: User | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  // Get all registered users
  getRegisteredUsers(): User[] {
    if (typeof window === 'undefined') return [];
    try {
      const usersData = localStorage.getItem(USERS_STORAGE_KEY);
      return usersData ? JSON.parse(usersData) : [];
    } catch {
      return [];
    }
  },

  // Add a new registered user
  addRegisteredUser(user: User): void {
    if (typeof window === 'undefined') return;
    const users = this.getRegisteredUsers();
    users.push(user);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  // Find user by email
  findUserByEmail(email: string): User | null {
    const users = this.getRegisteredUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  },

  // Validate login credentials
  validateLogin(email: string, password: string): User | null {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    
    // In a real app, you'd hash and compare passwords properly
    // For demo purposes, we'll use a simple check
    const storedPassword = localStorage.getItem(`password_${user.id}`);
    if (storedPassword === password) {
      // Update last login
      user.lastLogin = new Date().toISOString();
      const users = this.getRegisteredUsers();
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = user;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
      return user;
    }
    return null;
  },

  // Register a new user
  registerUser(userData: RegisterData): { success: boolean; error?: string; user?: User } {
    // Check if user already exists
    if (this.findUserByEmail(userData.email)) {
      return { success: false, error: 'An account with this email already exists' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Validate password strength
    if (userData.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email.toLowerCase(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      dateOfBirth: userData.dateOfBirth,
      patientId: userData.patientId || `patient_${Date.now()}`,
      isVerified: true, // In a real app, this would require email verification
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    // Store user and password
    this.addRegisteredUser(newUser);
    localStorage.setItem(`password_${newUser.id}`, userData.password);

    return { success: true, user: newUser };
  }
};

// Demo users for testing (optional)
export const createDemoUsers = () => {
  if (typeof window === 'undefined') return;
  
  const existingUsers = authStorage.getRegisteredUsers();
  if (existingUsers.length > 0) return; // Don't create demo users if users already exist

  const demoUsers = [
    {
      email: 'patient@demo.com',
      password: 'demo123',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1985-06-15',
      role: 'patient' as const
    },
    {
      email: 'doctor@demo.com',
      password: 'demo123',
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      dateOfBirth: '1978-03-22',
      role: 'healthcare_provider' as const
    }
  ];

  demoUsers.forEach(userData => {
    authStorage.registerUser(userData);
  });
};
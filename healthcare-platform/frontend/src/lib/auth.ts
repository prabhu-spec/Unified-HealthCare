// Authentication utilities for healthcare platform
import { createContext, useContext } from 'react';

export type UserRole =
  | 'super_admin'
  | 'insurance_provider'
  | 'medical_vendor'
  | 'hospital_admin'
  | 'bloodbank_admin'
  | 'doctor'
  | 'nurse'
  | 'patient';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  dateOfBirth?: string;
  gender?: string; // For donor matching: Male, Female, Other
  bloodType?: string; // For donor matching: A+, A-, B+, B-, AB+, AB-, O+, O-
  patientId?: string;
  hospitalId?: string; // For hospital_admin, doctor – which hospital they belong to
  specialization?: string; // For doctor – e.g. ortho, general, gynecology, ophthalmology, neurology
  isVerified: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  deleteAccount: () => void;
  isAuthenticated: boolean;
  requestForgotPasswordOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordChangeOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  requestDeleteAccountOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  confirmDeleteAccount: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  forgotEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  role: UserRole;
  gender?: string;
  bloodType?: string;
  patientId?: string;
  hospitalId?: string;
  specialization?: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AUTH_STORAGE_KEY = 'healthcare_auth_user';
const AUTH_TOKEN_KEY = 'healthcare_auth_token';
const USERS_STORAGE_KEY = 'healthcare_registered_users';

const VALID_ROLES: UserRole[] = ['super_admin', 'insurance_provider', 'medical_vendor', 'hospital_admin', 'bloodbank_admin', 'doctor', 'nurse', 'patient'];

/** Legacy/alternate role values that should map to a valid UserRole (e.g. old UI used "healthcare_provider" for doctor). */
const ROLE_ALIASES: Record<string, UserRole> = {
  healthcare_provider: 'doctor',
  physician: 'doctor',
  provider: 'doctor',
};

/** Known demo accounts: fix role by email so it stays correct in every browser (e.g. Chrome vs Cursor). */
const DEMO_EMAIL_TO_ROLE: Record<string, UserRole> = {
  'doctor@demo.com': 'doctor',
  'patient@demo.com': 'patient',
  'superadmin@demo.com': 'super_admin',
  'insurance@demo.com': 'insurance_provider',
  'vendor@demo.com': 'medical_vendor',
  'hospitaladmin@demo.com': 'hospital_admin',
  'hospitaladmin2@demo.com': 'hospital_admin',
  'bloodbank@demo.com': 'bloodbank_admin',
  'nurse@demo.com': 'nurse',
};

/** Normalize role string to valid UserRole (e.g. "Doctor" -> "doctor"). Use for safe lookups. */
export function normalizeRole(role: unknown): UserRole {
  const r = (typeof role === 'string' ? role : '').toLowerCase().trim();
  if (ROLE_ALIASES[r]) return ROLE_ALIASES[r];
  return (VALID_ROLES.includes(r as UserRole) ? r : 'patient') as UserRole;
}

function normalizeUser(user: User): User {
  const email = (user.email || '').toLowerCase().trim();
  const roleByEmail = DEMO_EMAIL_TO_ROLE[email];
  const role = roleByEmail ?? normalizeRole(user.role);
  return { ...user, role };
}

export const authStorage = {
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const userData = localStorage.getItem(AUTH_STORAGE_KEY);
      const user = userData ? JSON.parse(userData) : null;
      if (!user) return null;
      const normalized = normalizeUser(user);
      // Persist corrected role (e.g. doctor@demo.com always as Doctor) in this browser
      if (normalized.role !== user.role) {
        this.setCurrentUser(normalized);
        const users = this.getRegisteredUsers();
        const idx = users.findIndex((u) => u.id === normalized.id);
        if (idx !== -1) {
          users[idx] = { ...users[idx], role: normalized.role };
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
      }
      return normalized;
    } catch {
      return null;
    }
  },

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  setAccessToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  setCurrentUser(user: User | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      this.setAccessToken(null);
    }
  },

  updateCurrentUser(updates: Partial<User>): User | null {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated = { ...current, ...updates };
    this.setCurrentUser(updated);
    const users = this.getRegisteredUsers();
    const idx = users.findIndex((u) => u.id === current.id);
    if (idx !== -1) {
      users[idx] = updated;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    return updated;
  },

  getRegisteredUsers(): User[] {
    if (typeof window === 'undefined') return [];
    try {
      const usersData = localStorage.getItem(USERS_STORAGE_KEY);
      return usersData ? JSON.parse(usersData) : [];
    } catch {
      return [];
    }
  },

  addRegisteredUser(user: User): void {
    if (typeof window === 'undefined') return;
    const users = this.getRegisteredUsers();
    users.push(user);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  /** Remove current user from registered users and clear auth + password storage. */
  deleteCurrentUser(): void {
    if (typeof window === 'undefined') return;
    const current = this.getCurrentUser();
    if (current) {
      const users = this.getRegisteredUsers().filter((u) => u.id !== current.id);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      localStorage.removeItem(`password_${current.id}`);
    }
    this.setCurrentUser(null);
  },

  findUserByEmail(email: string): User | null {
    const users = this.getRegisteredUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  },

  /** Update stored password for a user by email (e.g. after reset-password). */
  setPasswordForEmail(email: string, password: string): void {
    const user = this.findUserByEmail(email);
    if (user) localStorage.setItem(`password_${user.id}`, password);
  },

  /** Remove a user by email from registered users and clear password (e.g. after confirm-delete). */
  deleteUserByEmail(email: string): void {
    const user = this.findUserByEmail(email);
    if (!user) return;
    localStorage.removeItem(`password_${user.id}`);
    const users = this.getRegisteredUsers().filter((u) => u.id !== user.id);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    const current = this.getCurrentUser();
    if (current?.id === user.id) this.setCurrentUser(null);
  },

  validateLogin(email: string, password: string): User | null {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    const storedPassword = localStorage.getItem(`password_${user.id}`);
    if (storedPassword === password) {
      user.lastLogin = new Date().toISOString();
      user.role = normalizeRole(user.role);
      const users = this.getRegisteredUsers();
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], role: user.role };
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
      return user;
    }
    return null;
  },

  registerUser(userData: RegisterData): { success: boolean; error?: string; user?: User } {
    if (this.findUserByEmail(userData.email)) {
      return { success: false, error: 'An account with this email already exists' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (userData.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email.toLowerCase(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: normalizeRole(userData.role),
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      bloodType: userData.bloodType,
      patientId: userData.patientId || `patient_${Date.now()}`,
      hospitalId: userData.hospitalId,
      specialization: userData.specialization,
      isVerified: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    this.addRegisteredUser(newUser);
    localStorage.setItem(`password_${newUser.id}`, userData.password);
    return { success: true, user: newUser };
  }
};

// Demo users – each hospital has its own admin; doctor is tied to one hospital. Password for all: demo123
const DEMO_CREDENTIALS = [
  { email: 'superadmin@demo.com', password: 'demo123', firstName: 'Super', lastName: 'Admin', dateOfBirth: '1980-01-01', role: 'super_admin' as UserRole },
  { email: 'insurance@demo.com', password: 'demo123', firstName: 'Insurance', lastName: 'Provider', dateOfBirth: '1982-05-10', role: 'insurance_provider' as UserRole },
  { email: 'vendor@demo.com', password: 'demo123', firstName: 'Medical', lastName: 'Vendor', dateOfBirth: '1975-08-22', role: 'medical_vendor' as UserRole },
  { email: 'hospitaladmin@demo.com', password: 'demo123', firstName: 'Hospital', lastName: 'Admin', dateOfBirth: '1978-03-15', role: 'hospital_admin' as UserRole, hospitalId: 'org-1' },
  { email: 'hospitaladmin2@demo.com', password: 'demo123', firstName: 'Admin', lastName: 'Two', dateOfBirth: '1979-04-20', role: 'hospital_admin' as UserRole, hospitalId: 'org-2' },
  { email: 'doctor@demo.com', password: 'demo123', firstName: 'Dr. Sarah', lastName: 'Johnson', dateOfBirth: '1985-11-20', role: 'doctor' as UserRole, hospitalId: 'org-1', specialization: 'general', gender: 'female', bloodType: 'O+' },
  { email: 'nurse@demo.com', password: 'demo123', firstName: 'Jane', lastName: 'Miller', dateOfBirth: '1988-04-12', role: 'nurse' as UserRole, hospitalId: 'org-1', gender: 'female', bloodType: 'B+' },
  { email: 'patient@demo.com', password: 'demo123', firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-06-15', role: 'patient' as UserRole, gender: 'male', bloodType: 'A+' },
  { email: 'bloodbank@demo.com', password: 'demo123', firstName: 'Blood', lastName: 'Bank Admin', dateOfBirth: '1982-08-10', role: 'bloodbank_admin' as UserRole }
];

export const createDemoUsers = () => {
  if (typeof window === 'undefined') return;
  const existing = authStorage.getRegisteredUsers();
  const demoEmails = DEMO_CREDENTIALS.map((d) => d.email.toLowerCase());
  const hasAll = demoEmails.every((email) => existing.some((u) => u.email.toLowerCase() === email));
  if (hasAll && existing.length >= DEMO_CREDENTIALS.length) return;

  DEMO_CREDENTIALS.forEach((d) => {
    if (authStorage.findUserByEmail(d.email)) return;
    authStorage.registerUser({
      ...d,
      patientId: d.role === 'patient' ? 'patient-1' : undefined,
      specialization: (d as any).specialization,
      gender: (d as any).gender,
      bloodType: (d as any).bloodType
    });
  });
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  insurance_provider: 'Insurance Agent',
  medical_vendor: 'Pharmacy Vendor',
  hospital_admin: 'Hospital Admin',
  bloodbank_admin: 'Blood Bank Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  patient: 'Patient'
};

/** All roles for sign-up / role selection */
export const ROLES_FOR_SIGNUP: { value: UserRole; label: string }[] = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'medical_vendor', label: 'Pharmacy Vendor' },
  { value: 'insurance_provider', label: 'Insurance Agent' },
  { value: 'hospital_admin', label: 'Hospital Admin' },
  { value: 'bloodbank_admin', label: 'Blood Bank Admin' },
  { value: 'super_admin', label: 'Super Admin' }
];

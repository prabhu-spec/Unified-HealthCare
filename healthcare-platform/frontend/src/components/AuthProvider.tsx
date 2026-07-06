'use client';

import { useState, useEffect, ReactNode } from 'react';
import { AuthContext, User, RegisterData, authStorage, createDemoUsers, normalizeRole } from '@/lib/auth';
import { getApiBase } from '@/lib/api';

interface AuthProviderProps {
  children: ReactNode;
}

function normalizeUserFromBackend(user: Record<string, unknown>): User {
  return {
    id: String(user.id ?? ''),
    email: String(user.email ?? '').toLowerCase().trim(),
    firstName: String(user.firstName ?? ''),
    lastName: String(user.lastName ?? ''),
    role: normalizeRole(user.role),
    dateOfBirth: user.dateOfBirth as string | undefined,
    gender: user.gender as string | undefined,
    bloodType: user.bloodType as string | undefined,
    patientId: user.patientId as string | undefined,
    hospitalId: user.hospitalId as string | undefined,
    specialization: user.specialization as string | undefined,
    isVerified: Boolean(user.isVerified),
    createdAt: String(user.createdAt ?? ''),
    lastLogin: String(user.lastLogin ?? ''),
  };
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      createDemoUsers();
      const currentUser = authStorage.getCurrentUser();
      if (!currentUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const apiBase = getApiBase();
      try {
        const token = authStorage.getAccessToken();
        const res = await fetch(`${apiBase}/api/auth/check`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          setUser(null);
          authStorage.setCurrentUser(null);
          authStorage.setAccessToken(null);
        }
      } catch {
        setUser(null);
        authStorage.setCurrentUser(null);
        authStorage.setAccessToken(null);
      }
      setUser(authStorage.getCurrentUser());
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const apiBase = getApiBase();
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: (email || '').trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.user) {
        const normalized = normalizeUserFromBackend(data.user);
        setUser(normalized);
        authStorage.setCurrentUser(normalized);
        if (data.token) authStorage.setAccessToken(String(data.token));
        return { success: true };
      }
      if (res.status === 401) {
        const localUser = authStorage.validateLogin((email || '').trim(), password);
        if (localUser) {
          setUser(localUser);
          authStorage.setCurrentUser(localUser);
          return { success: true };
        }
        return { success: false, error: data.error || 'Invalid email or password.' };
      }
      return { success: false, error: data.error || 'Login failed.' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      if (message.includes('fetch') || message.includes('network') || message.includes('Failed')) {
        const localUser = authStorage.validateLogin((email || '').trim(), password);
        if (localUser) {
          setUser(localUser);
          authStorage.setCurrentUser(localUser);
          return { success: true };
        }
        return { success: false, error: 'Cannot reach server. Please ensure the backend is connected (e.g. running on AWS).' };
      }
      return { success: false, error: message || 'Login failed. Please try again.' };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const result = authStorage.registerUser(userData);
      if (result.success && result.user) {
        setUser(result.user);
        authStorage.setCurrentUser(result.user);
        // Send welcome email via backend (fire-and-forget; don't block registration)
        const apiBase = getApiBase();
        fetch(`${apiBase}/api/email/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
          }),
        }).catch(() => {});
        return { success: true };
      }
      return { success: false, error: result.error || 'Registration failed' };
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const updateUser = (updates: Partial<User>) => {
    const updated = authStorage.updateCurrentUser(updates);
    if (updated) setUser(updated);
  };

  const logout = () => {
    authStorage.setAccessToken(null);
    setUser(null);
    authStorage.setCurrentUser(null);
  };

  const deleteAccount = () => {
    authStorage.deleteCurrentUser();
    setUser(null);
  };

  const authFetch = async (path: string, body: Record<string, unknown>) => {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: data.error || 'Request failed.' };
    return { success: true, ...data };
  };

  const requestForgotPasswordOTP = (email: string) =>
    authFetch('/api/auth/forgot-password', { email: (email || '').trim() });

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const result = await authFetch('/api/auth/reset-password', {
      email: (email || '').trim(),
      otp: (otp || '').trim(),
      newPassword,
    });
    if (result.success) authStorage.setPasswordForEmail((email || '').trim(), newPassword);
    return result;
  };

  const requestPasswordChangeOTP = (email: string) =>
    authFetch('/api/auth/request-password-change-otp', { email: (email || '').trim() });

  const changePassword = async (email: string, otp: string, newPassword: string) => {
    const result = await authFetch('/api/auth/change-password', {
      email: (email || '').trim(),
      otp: (otp || '').trim(),
      newPassword,
    });
    if (result.success) authStorage.setPasswordForEmail((email || '').trim(), newPassword);
    return result;
  };

  const requestDeleteAccountOTP = (email: string) =>
    authFetch('/api/auth/request-delete-account-otp', { email: (email || '').trim() });

  const confirmDeleteAccount = async (email: string, otp: string) => {
    const result = await authFetch('/api/auth/confirm-delete-account', {
      email: (email || '').trim(),
      otp: (otp || '').trim(),
    });
    if (result.success) {
      authStorage.deleteUserByEmail((email || '').trim());
      setUser(null);
    }
    return result;
  };

  const forgotEmail = (email: string) =>
    authFetch('/api/auth/forgot-email', { email: (email || '').trim() });

  const value = {
    user,
    isLoading,
    login,
    register,
    updateUser,
    logout,
    deleteAccount,
    isAuthenticated: !!user,
    requestForgotPasswordOTP,
    resetPassword,
    requestPasswordChangeOTP,
    changePassword,
    requestDeleteAccountOTP,
    confirmDeleteAccount,
    forgotEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

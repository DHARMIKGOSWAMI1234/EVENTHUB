// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import { authApi } from '../services/authApi';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isCustomer: boolean;
  isOrganizer: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { full_name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('eventhub_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const { error: toastError, info: toastInfo } = useToast();

  const clearSession = useCallback(() => {
    localStorage.removeItem('eventhub_token');
    localStorage.removeItem('eventhub_refresh_token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async (): Promise<User | null> => {
    const currentToken = localStorage.getItem('eventhub_token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      return userData;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    refreshProfile();

    const handleSessionExpired = () => {
      clearSession();
      toastError('Your session has expired. Please sign in again.', 'Session Expired');
    };

    window.addEventListener('eventhub:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('eventhub:session_expired', handleSessionExpired);
    };
  }, [refreshProfile, clearSession, toastError]);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const tokens = await authApi.login({ email, password });
      localStorage.setItem('eventhub_token', tokens.access_token);
      localStorage.setItem('eventhub_refresh_token', tokens.refresh_token);
      setToken(tokens.access_token);

      const userData = await authApi.getMe();
      setUser(userData);
      return userData;
    } catch (err) {
      clearSession();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<User> => {
    setLoading(true);
    try {
      const newUser = await authApi.register(payload);
      // Auto-login after registration
      await login(payload.email, payload.password);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearSession();
      toastInfo('You have been logged out.');
    }
  };

  const isCustomer = user?.role === 'CUSTOMER';
  const isOrganizer = user?.role === 'ORGANIZER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: !!user && !!token,
        isCustomer,
        isOrganizer,
        isAdmin,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        refreshUser: refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

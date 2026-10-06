'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, tokenStorage } from '@/lib/api-client';
import type { UserResponseDto } from '@community-os/contracts';

interface AuthContextType {
  user: UserResponseDto | null;
  isPlatformAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setUser(null);
      setIsPlatformAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.auth.getMe();
      setUser(res.user);
      setIsPlatformAdmin(Boolean(res.isPlatformAdmin));
    } catch {
      // If token expired, attempt refresh
      try {
        await apiClient.auth.refresh();
        const res = await apiClient.auth.getMe();
        setUser(res.user);
        setIsPlatformAdmin(Boolean(res.isPlatformAdmin));
      } catch {
        tokenStorage.clearTokens();
        setUser(null);
        setIsPlatformAdmin(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.auth.login({ email, password });
      setUser(res.user);
      setIsPlatformAdmin(true); // Platform admin or tenant admin resolved on me
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient.auth.logout();
    } catch {
      tokenStorage.clearTokens();
    } finally {
      setUser(null);
      setIsPlatformAdmin(false);
      setIsLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isPlatformAdmin,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

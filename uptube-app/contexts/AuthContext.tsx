import React, { createContext, useContext, useEffect, useState } from 'react';
import { get, post } from '@/lib/utils/fetch';
import { clearAuthCookies } from '@/lib/utils/cookie-manager';
import { removeItemSecure } from '@/lib/utils/async-storage';
import { router } from 'expo-router';

type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      // Attempt to fetch user profile using cookies
      // fetch.ts handles cookie injection automatically
      const userProfile = await get({
        endpoint: '/protected/users/profile',
        throwable: true,
      });

      if (userProfile) {
        setUser(userProfile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Auth check failed (likely not logged in):', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await post({
        endpoint: '/public/auth/login',
        params: data,
        throwable: true,
      });

      if (response) {
        // Login successful, now fetch fresh user profile
        const userProfile = await get({
          endpoint: '/protected/users/profile',
          throwable: true,
        });

        console.log('userProfile', userProfile);

        if (userProfile) {
          setUser(userProfile);
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await post({
        endpoint: '/public/auth/register',
        params: data,
        throwable: true,
      });

      if (response) {
        // Register successful and usually auto-logged in, fetch profile
        const userProfile = await get({
          endpoint: '/protected/users/profile',
          throwable: true,
        });

        if (userProfile) {
          setUser(userProfile);
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      console.error('Register failed:', error.message, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await post({ endpoint: '/public/auth/logout' });
    } catch (e) {
      // ignore
    } finally {
      await removeItemSecure('user_info');
      await clearAuthCookies();
      setUser(null);
      setIsLoading(false);
      router.replace('/auth/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

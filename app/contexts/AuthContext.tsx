import React, { createContext, useContext, useEffect, useState } from 'react';
import { get, post } from '@/lib/utils/fetch';
import { getItemSecure, removeItemSecure, setItemSecure } from '@/lib/utils/async-storage';
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
      // First check if we have a token or cookies stored
      // The new fetch.ts handles cookies automatically, but we might want to verify session
      // by calling a /me endpoint or similar if it exists.
      // For now, let's rely on stored user info or token presence.

      // Let's assume we store user info in secure storage on login
      const storedUser = await getItemSecure('user_info');
      // And check if we have cookies
      const cookies = await getItemSecure('auth_cookies');

      if (storedUser && cookies) {
        setUser(storedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
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
        // Fetch user details immediately after login to get the user object
        // Or if the login returns user object, use that.
        // Assuming login returns { message: "...", user?: ... } or we fetch profile

        // Let's fetch profile. Assuming /auth/me or /users/me exists, or just use what we have
        // Since I don't know the exact endpoint for user profile, I'll assume login returns it
        // OR I will just store a dummy user for now based on success until I know the /me endpoint.
        // Wait, looking at the backend code provided earlier, login just returns message.
        // So I might need to decode the token or fetch user details.

        // Ideally, we should fetch user details.
        // For now, let's just use email from input and generic ID or fetch from a profile endpoint if you implement one.
        // Actually, the new backend logic I wrote earlier didn't include a /me endpoint explicitly in the snippets,
        // but `auth.controller.ts` `login` returned `message`.

        // I will optimistically set user based on input for now, but in a real app
        // you should return user data in login response or fetch it.
        // Let's simulate caching user info

        // NOTE: You should implement a /me endpoint in backend.
        // For now, I'll store what I can.
        const userInfo = { email: data.email, id: 'unknown' };
        await setItemSecure('user_info', userInfo);
        setUser(userInfo as User);
        router.replace('/(tabs)');
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
        // After register, usually we are logged in automatically via cookies
        const userInfo = { email: data.email, name: data.name, id: 'unknown' };
        await setItemSecure('user_info', userInfo);
        setUser(userInfo as User);
        router.replace('/(tabs)');
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
      await post({ endpoint: '/auth/logout' });
    } catch (e) {
      // ignore
    } finally {
      await removeItemSecure('user_info');
      await removeItemSecure('auth_cookies');
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

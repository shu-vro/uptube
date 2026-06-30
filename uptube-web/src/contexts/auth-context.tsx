"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api";

type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const userProfile = await get({
        endpoint: "/protected/users/profile",
        throwable: true,
      });
      setUser(userProfile ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      await post({
        endpoint: "/public/auth/login",
        params: data,
        throwable: true,
      });
      const userProfile = await get({
        endpoint: "/protected/users/profile",
        throwable: true,
      });
      if (userProfile) {
        setUser(userProfile);
        router.replace("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      await post({
        endpoint: "/public/auth/register",
        params: data,
        throwable: true,
      });
      const userProfile = await get({
        endpoint: "/protected/users/profile",
        throwable: true,
      });
      if (userProfile) {
        setUser(userProfile);
        router.replace("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await post({ endpoint: "/public/auth/logout" });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setIsLoading(false);
      router.replace("/auth/login");
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

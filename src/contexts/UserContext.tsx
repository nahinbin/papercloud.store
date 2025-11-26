"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";

export interface PublicUser {
  id: string;
  name?: string;
  username: string;
  email?: string;
  isAdmin: boolean;
  createdAt: number;
}

interface UserContextType {
  user: PublicUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasStartedLoadingRef = useRef(false);

  const refreshUser = useCallback(async () => {
    // Set loading to true when manually refreshing (e.g., after login)
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache control to ensure fresh data from PostgreSQL
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        setPermissions(data.permissions || []);
      } else {
        setUser(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start loading immediately on mount - don't wait for useEffect
  useEffect(() => {
    // Only start loading once
    if (!hasStartedLoadingRef.current) {
      hasStartedLoadingRef.current = true;
      // Start the fetch immediately
      refreshUser();
    }
  }, [refreshUser]);

  return (
    <UserContext.Provider
      value={{
        user,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}


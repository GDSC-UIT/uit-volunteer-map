import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@uit-volunteer-map/shared";
import { STORAGE_KEYS } from "@uit-volunteer-map/shared";
import { AuthContext } from "./AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { onUnauthorized } from "@/api/client";
import { authApi } from "@/api";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    void queryClient.cancelQueries();
    queryClient.clear();
  }, [queryClient]);


  useEffect(() => onUnauthorized(failedToken => {
    // A late response from a previous session must not sign out the new account.
    if (localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) === failedToken) clearSession();
  }), [clearSession]);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const syncRestoredSession = () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (storedToken === token) return;
      const storedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (!storedToken || !storedUser) { clearSession(); return; }
      try {
        const restoredUser = JSON.parse(storedUser) as AuthUser;
        void queryClient.cancelQueries();
        queryClient.clear();
        setUser(restoredUser);
        setToken(storedToken);
      } catch { clearSession(); }
    };
    // Browser Back can restore an old in-memory provider from the back/forward cache.
    window.addEventListener('pageshow', syncRestoredSession);
    window.addEventListener('storage', syncRestoredSession);
    return () => {
      window.removeEventListener('pageshow', syncRestoredSession);
      window.removeEventListener('storage', syncRestoredSession);
    };
  }, [token, clearSession, queryClient]);

  const login = useCallback(async (username: string, password: string) => {
    const { token: newToken, user: newUser } = await authApi.login(
      username,
      password,
    );

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    clearSession();
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

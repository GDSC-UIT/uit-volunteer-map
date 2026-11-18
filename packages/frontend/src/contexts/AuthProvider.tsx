import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '@uit-volunteer-map/shared';
import { STORAGE_KEYS } from '@uit-volunteer-map/shared';
import { AuthContext } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { onUnauthorized } from '@/api/client';
import { authApi } from '@/api';
import { isAuthUser, sessionExpiry } from './session';

type Session = { token: string; user: AuthUser };
export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const current = useRef<Session | null>(null);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const invalidatePending = useCallback(() => {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    return generation.current;
  }, []);
  const clearCache = useCallback(() => {
    void queryClient.cancelQueries();
    queryClient.clear();
  }, [queryClient]);
  const clearSession = useCallback(() => {
    invalidatePending();
    current.current = null;
    setSession(null);
    setIsLoading(false);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    clearCache();
  }, [clearCache, invalidatePending]);
  const applySession = useCallback((next: Session) => {
    const previous = current.current;
    if (previous && (previous.token !== next.token || previous.user.accId !== next.user.accId || previous.user.role !== next.user.role)) clearCache();
    current.current = next;
    setSession(next);
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, next.token);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(next.user));
    setIsLoading(false);
  }, [clearCache]);

  const restoreSession = useCallback(async () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!storedToken && !current.current && !localStorage.getItem(STORAGE_KEYS.AUTH_USER)) {
      // Guest focus must neither discard public query data nor cancel a pending login.
      setIsLoading(false);
      return;
    }
    const expiry = storedToken ? sessionExpiry(storedToken) : null;
    if (!storedToken || !expiry || expiry <= Date.now()) { clearSession(); return; }
    const active = current.current;
    if (!active || active.token !== storedToken) {
      if (active) clearCache();
      current.current = null;
      setSession(null);
      setIsLoading(true);
    }
    const attempt = invalidatePending();
    const abort = new AbortController();
    controller.current = abort;
    try {
      const verifiedUser = await authApi.verify(storedToken, abort.signal);
      if (attempt !== generation.current || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) !== storedToken) return;
      if (!isAuthUser(verifiedUser) || expiry <= Date.now()) { clearSession(); return; }
      applySession({ token: storedToken, user: verifiedUser });
    } catch (error) {
      if (attempt !== generation.current || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) !== storedToken) return;
      const status = (error as { response?: { status?: number } })?.response?.status;
      // Initial restore fails closed. A transient focus refresh must preserve an active draft.
      if (!active || active.token !== storedToken || status === 401 || status === 403 || expiry <= Date.now()) clearSession();
    }
  }, [applySession, clearCache, clearSession, invalidatePending]);

  useEffect(() => onUnauthorized(failedToken => {
    if (localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) === failedToken) clearSession();
  }), [clearSession]);
  useEffect(() => {
    const refresh = () => { void restoreSession(); };
    const storage = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEYS.AUTH_TOKEN || event.key === STORAGE_KEYS.AUTH_USER) refresh();
    };
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    refresh();
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', storage);
    document.addEventListener('visibilitychange', visible);
    return () => {
      invalidatePending();
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', storage);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [restoreSession, invalidatePending]);
  useEffect(() => {
    if (!session) return;
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      if (localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) !== session.token) { void restoreSession(); return; }
      const remaining = (sessionExpiry(session.token) ?? 0) - Date.now();
      if (remaining <= 0) clearSession();
      else timer = setTimeout(check, Math.min(remaining, 2_147_483_647));
    };
    check();
    return () => clearTimeout(timer);
  }, [session, clearSession, restoreSession]);

  const login = useCallback(async (username: string, password: string) => {
    const attempt = invalidatePending();
    const previousToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const next = await authApi.login(username, password);
    if (attempt !== generation.current || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) !== previousToken) return;
    const expiry = sessionExpiry(next.token);
    if (!expiry || expiry <= Date.now() || !isAuthUser(next.user)) throw new Error('Invalid login response');
    clearCache();
    applySession(next);
  }, [applySession, clearCache, invalidatePending]);
  const logout = useCallback(async () => {
    clearSession();
    try { await authApi.logout(); } catch { /* Local logout completes even offline. */ }
  }, [clearSession]);

  return <AuthContext.Provider value={{ user: session?.user ?? null, token: session?.token ?? null,
    isAuthenticated: !!session, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

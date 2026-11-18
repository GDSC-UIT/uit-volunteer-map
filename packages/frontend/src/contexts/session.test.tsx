import { act, cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { AuthUser } from '@uit-volunteer-map/shared';
import AuthProvider from './AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import type { AuthContextType } from './AuthContext';
import { authApi } from '@/api';
import { isAuthUser, sessionExpiry } from './session';
vi.mock('@/api', () => ({ authApi: { verify: vi.fn(), login: vi.fn(), logout: vi.fn() } }));
const admin: AuthUser = { accId: 1, username: 'test', role: 'admin' };
const leader: AuthUser = { ...admin, role: 'leader' };
let auth: AuthContextType;
function Probe() { auth = useAuth(); return <p>{auth.isLoading ? 'Loading' : auth.user?.role ?? 'Guest'}</p>; }
function token(seconds = 3600) { return `e30.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }))}.signature`; }
function seed(value = token()) { localStorage.setItem('auth_token', value); localStorage.setItem('auth_user', JSON.stringify(admin)); return value; }
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>);
  return client;
}
beforeEach(() => { localStorage.clear(); vi.mocked(authApi.verify).mockReset().mockResolvedValue(admin); vi.mocked(authApi.login).mockReset(); vi.mocked(authApi.logout).mockReset().mockResolvedValue(); });
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); });
it.each(['malformed', token(-10), 'e30.e30.signature'])('clears malformed/expired cached token %s without trusting its role', async value => {
  seed(value); const client = mount(); await screen.findByText('Guest');
  expect(authApi.verify).not.toHaveBeenCalled(); expect(localStorage.getItem('auth_user')).toBeNull(); expect(client.getQueryCache().getAll()).toHaveLength(0);
});
it('waits for server verification and replaces forged cached role with current account role', async () => {
  seed(); let finish!: (user: AuthUser) => void;
  vi.mocked(authApi.verify).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  mount(); expect(screen.getByText('Loading')).toBeInTheDocument();
  await act(async () => finish(leader));
  expect(screen.getByText('leader')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('auth_user')!).role).toBe('leader');
});
it('expires an idle session at exp, clearing private cache and storage', async () => {
  vi.useFakeTimers(); seed(token(2)); const client = mount();
  await act(async () => undefined);
  expect(auth.isAuthenticated).toBe(true); client.setQueryData(['private'], 'secret');
  await act(async () => vi.advanceTimersByTime(2001));
  expect(screen.getByText('Guest')).toBeInTheDocument(); expect(client.getQueryCache().getAll()).toHaveLength(0); expect(localStorage.getItem('auth_token')).toBeNull();
});
it('refreshes the server role on focus and clears cached data on a role change', async () => {
  seed(); const client = mount(); await screen.findByText('admin'); client.setQueryData(['private'], 'secret');
  vi.mocked(authApi.verify).mockResolvedValue(leader);
  await act(async () => window.dispatchEvent(new Event('focus')));
  await screen.findByText('leader'); expect(client.getQueryCache().getAll()).toHaveLength(0);
});
it('fails initial restore closed but retains an active draft for a transient refresh failure', async () => {
  seed(); vi.mocked(authApi.verify).mockRejectedValueOnce(new Error('offline')); mount(); await screen.findByText('Guest');
  cleanup(); seed(); const client = mount(); await screen.findByText('admin'); client.setQueryData(['draft'], 'keep');
  vi.mocked(authApi.verify).mockRejectedValue(new Error('offline'));
  await act(async () => window.dispatchEvent(new Event('focus')));
  expect(screen.getByText('admin')).toBeInTheDocument(); expect(client.getQueryData(['draft'])).toBe('keep');
});
it('does not resurrect a session when verification finishes after logout', async () => {
  seed(); let finish!: (user: AuthUser) => void;
  vi.mocked(authApi.verify).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  mount(); await act(async () => auth.logout()); await act(async () => finish(admin));
  expect(screen.getByText('Guest')).toBeInTheDocument(); expect(localStorage.getItem('auth_token')).toBeNull();
});
it('ignores a login response arriving after logout', async () => {
  mount(); await screen.findByText('Guest'); let finish!: (response: { user: AuthUser; token: string }) => void;
  vi.mocked(authApi.login).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const pending = auth.login('test', 'synthetic');
  await act(async () => auth.logout()); await act(async () => { finish({ user: admin, token: token() }); await pending; });
  expect(screen.getByText('Guest')).toBeInTheDocument(); expect(localStorage.getItem('auth_token')).toBeNull();
});
it('revalidates a different tab token before revealing its user, ignoring old verification', async () => {
  seed(); let finishOld!: (user: AuthUser) => void;
  vi.mocked(authApi.verify).mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }));
  mount(); const next = token(7200); localStorage.setItem('auth_token', next); vi.mocked(authApi.verify).mockResolvedValue(leader);
  await act(async () => window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: next })));
  await screen.findByText('leader'); await act(async () => finishOld(admin));
  expect(auth.user?.role).toBe('leader'); expect(auth.token).toBe(next);
});
it('rejects unsafe session identity/expiry values', () => {
  for (const value of [null, {}, { ...admin, role: 'owner' }, { ...admin, accId: -1 }, { ...admin, username: '' }]) expect(isAuthUser(value)).toBe(false);
  expect(sessionExpiry(`e30.${btoa(JSON.stringify({ exp: Number.MAX_SAFE_INTEGER }))}.sig`)).toBeNull();
});
it('preserves Guest public queries and a pending login across focus', async () => {
  const client = mount(); await screen.findByText('Guest'); client.setQueryData(['public'], 'keep');
  let finish!: (response: { user: AuthUser; token: string }) => void;
  vi.mocked(authApi.login).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const pending = auth.login('test', 'synthetic');
  await act(async () => window.dispatchEvent(new Event('focus')));
  expect(client.getQueryData(['public'])).toBe('keep');
  await act(async () => { finish({ user: leader, token: token() }); await pending; });
  expect(auth.user?.role).toBe('leader');
});

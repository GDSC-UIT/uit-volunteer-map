import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { AxiosError } from 'axios';
import AuthProvider from './AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/api/client';
import LeaderDropdown from '@/components/dropdown/LeaderDropdown';
import AdminLayout from '@/components/layouts/AdminLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { authApi } from '@/api';
vi.mock('@/api', () => ({ authApi: { logout: vi.fn(), login: vi.fn(), verify: vi.fn() } }));
const originalAdapter = apiClient.defaults.adapter;
beforeEach(() => { localStorage.clear(); vi.mocked(authApi.logout).mockReset().mockResolvedValue();
  vi.mocked(authApi.verify).mockReset().mockImplementation(async () => JSON.parse(localStorage.getItem('auth_user')!)); });
afterEach(() => { cleanup(); apiClient.defaults.adapter = originalAdapter; localStorage.clear(); });
function seed(role = 'admin', token = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.synthetic`) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify({ accId: 1, username: 'test', role }));
}
function State() { const auth = useAuth(); return <p>{auth.isAuthenticated ? 'Signed in' : 'Signed out'}</p>; }
function mount(path = '/admin') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['private'], { secret: 'old session' });
  render(<QueryClientProvider client={client}><AuthProvider><State /><MemoryRouter initialEntries={[path]}>
    <Routes><Route element={<ProtectedRoute />}><Route path="/admin" element={<AdminLayout />} /><Route path="/leader" element={<LeaderDropdown />} /></Route>
      <Route path="/login" element={<h1>Login screen</h1>} /></Routes>
  </MemoryRouter></AuthProvider></QueryClientProvider>);
  return client;
}
function fail(status: number) {
  apiClient.defaults.adapter = async config => { throw new AxiosError('Request failed', undefined, config, undefined, {
    config, data: { error: 'Server rejection' }, status, statusText: 'Rejected', headers: {},
  }); };
}
it.each(['admin', 'leader'])('clears %s provider/storage/cache and protected UI even if logout API fails', async role => {
  seed(role); vi.mocked(authApi.logout).mockRejectedValue(new Error('offline'));
  const client = mount('/' + role); const user = userEvent.setup();
  await screen.findByText('Signed in');
  if (role === 'leader') { await user.click(screen.getByRole('button', { name: 'Xin chào!' })); await user.click(screen.getByRole('button', { name: 'Đăng xuất' })); await user.click(screen.getByRole('button', { name: 'Có' })); }
  else await user.click(screen.getByRole('button', { name: 'Đăng xuất' }));
  await screen.findByRole('heading', { name: 'Login screen' });
  expect(screen.getByText('Signed out')).toBeInTheDocument();
  expect(localStorage.getItem('auth_token')).toBeNull(); expect(localStorage.getItem('auth_user')).toBeNull();
  expect(client.getQueryCache().getAll()).toHaveLength(0);
});
it('expires the current session on protected 401 and preserves HTTP status/message', async () => {
  seed(); const client = mount(); await screen.findByText('Signed in'); fail(401);
  await act(async () => { await expect(apiClient.get('/private')).rejects.toMatchObject({ message: 'Server rejection', response: { status: 401 } }); });
  await screen.findByRole('heading', { name: 'Login screen' }); expect(client.getQueryCache().getAll()).toHaveLength(0);
});
it('keeps a valid session/cache after 403 and login credential failure', async () => {
  seed(); const client = mount(); await screen.findByText('Signed in'); fail(403);
  await expect(apiClient.get('/private')).rejects.toMatchObject({ response: { status: 403 } });
  fail(401); await expect(apiClient.post('/auth/login')).rejects.toMatchObject({ response: { status: 401 } });
  expect(screen.getByText('Signed in')).toBeInTheDocument(); expect(client.getQueryData(['private'])).toBeDefined();
});
it('ignores a late 401 from an older token', async () => {
  seed(); mount(); await screen.findByText('Signed in');
  let rejectOld!: () => void;
  apiClient.defaults.adapter = config => new Promise((_resolve, reject) => {
    rejectOld = () => reject(new AxiosError('expired', undefined, config, undefined, { config, data: {}, status: 401, statusText: 'Unauthorized', headers: {} }));
  });
  const pending = apiClient.get('/private').catch(error => error);
  await waitFor(() => expect(rejectOld).toBeDefined());
  localStorage.setItem('auth_token', 'new-token');
  await act(async () => { rejectOld(); await pending; });
  expect(screen.getByText('Signed in')).toBeInTheDocument(); expect(localStorage.getItem('auth_token')).toBe('new-token');
});
it('clears cached in-flight results rather than repopulating after logout', async () => {
  seed(); const client = mount(); await screen.findByText('Signed in');
  let resolveQuery!: (data: string) => void;
  const pending = client.fetchQuery({ queryKey: ['pending-private'], queryFn: () => new Promise<string>(resolve => { resolveQuery = resolve; }) }).catch(() => undefined);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Đăng xuất' }));
  await act(async () => { resolveQuery('secret'); await pending; });
  expect(client.getQueryCache().getAll()).toHaveLength(0);
});

it('rejects a cached protected session restored by browser Back after logout elsewhere', async () => {
  seed(); const client = mount(); await screen.findByText('Signed in');
  localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user');
  await act(async () => { window.dispatchEvent(new Event('pageshow')); });
  await screen.findByRole('heading', { name: 'Login screen' });
  expect(client.getQueryCache().getAll()).toHaveLength(0);
});

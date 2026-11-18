import { afterEach, expect, it } from 'vitest';
import apiClient from './client';
import { authApi } from './auth';
const originalAdapter = apiClient.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = originalAdapter; localStorage.clear(); });
it('verifies the captured session token even when storage already contains a newer token', async () => {
  localStorage.setItem('auth_token', 'new-session');
  const signal = new AbortController().signal;
  const user = { accId: 2, username: 'leader', role: 'leader' };
  apiClient.defaults.adapter = async config => {
    expect(config.headers.Authorization).toBe('Bearer captured-session');
    expect(config.signal).toBe(signal);
    return { config, data: { success: true, data: { isExpired: false, user } }, status: 200, statusText: 'OK', headers: {} };
  };
  expect(await authApi.verify('captured-session', signal)).toEqual(user);
  expect(localStorage.getItem('auth_token')).toBe('new-session');
});

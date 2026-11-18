import type { AuthUser } from '@uit-volunteer-map/shared';

/** Local expiry is a UX boundary only; the server verifies signature/account/role. */
export function sessionExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some(part => !/^[\w-]+$/.test(part))) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    return Number.isSafeInteger(exp) && exp > 0 && Number.isSafeInteger(exp * 1000) ? exp * 1000 : null;
  } catch { return null; }
}

export function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<AuthUser>;
  return Number.isSafeInteger(user.accId) && Number(user.accId) > 0 &&
    typeof user.username === 'string' && user.username.trim().length > 0 &&
    (user.role === 'admin' || user.role === 'leader');
}

/**
 * API route constants - single source of truth for all API endpoints
 */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
  },
  ADMIN: {
    BASE: '/api/admin',
  },
  LEADER: {
    BASE: '/api/leader',
  },
  HEALTH: '/api/health',
} as const;

/**
 * Auth error messages - consistent across FE/BE
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  TOKEN_REQUIRED: 'Access token required',
  TOKEN_INVALID: 'Invalid or expired token',
  PERMISSION_DENIED: 'Permission denied',
  JWT_SECRET_MISSING: 'JWT_SECRET is not defined',
  TOKEN_EXPIRED: "Token has expired",
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
} as const;

// Shared constants

export const API_VERSION = 'v1';

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  INVALID_ID: 'Invalid ID',
  FORBIDDEN_FIELD: 'You are not allowed to update this field',
  VALIDATION_FAILED: 'Validation failed',
} as const;

export const CAMPAIGN_ERRORS = {
  NOT_FOUND: 'Campaign not found',
  ALREADY_EXISTS: 'Campaign name already exists',
  INVALID_ID: 'Invalid campaign ID',
} as const;

export const CAMPAIGN_MESSAGES = {
  DELETED: 'Campaign deleted successfully',
} as const;

export const USER_ERRORS = {
  NOT_FOUND: 'User not found',
  EMAIL_TAKEN: 'Email is already taken',
} as const;

export const POST_MESSAGES = {
  CREATED: 'Post created successfully',
  UPDATED: 'Post updated successfully',
  DELETED: 'Post deleted successfully'
} as const;

export const POST_ERRORS = {
  NOT_FOUND: 'Post not found'
} as const;

export const TEAM_ERRORS = {
  NOT_FOUND: 'Team not found',
  ALREADY_EXISTS: 'Team name already exists',
  INVALID_ID: 'Invalid team ID',
  LEADER_NOT_FOUND: 'Leader not found',
  LEADER_INVALID_ROLE: 'User must have LEADER role',
  CAMPAIGN_NOT_FOUND: "Campaign not found",
  FORBIDDEN_ACCESS: 'You are not allowed to update this team',
} as const;

export const TEAM_MESSAGES = {
  CREATED: 'Team created successfully',
  UPDATED: 'Team updated successfully',
  DELETED: 'Team deleted successfully',
} as const;

export const SUCCESS_MESSAGES = {
  LOGGED_OUT: 'Logged out successfully',
  ADMIN_ACCESS_GRANTED: 'Admin access granted',
  LEADER_ACCESS_GRANTED: 'Leader access granted',
} as const;

export const HEALTH_MESSAGES = {
  STATUS_HEALTHY: 'healthy',
  SERVER_RUNNING: 'Server is running',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const USER_PROFILE_FIELDS = [
  'FullName',
  'Mssv',
  'Class',
  'Email',
  'PhoneNumber',
] as const;

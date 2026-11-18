import { httpPolicy } from './http.js';
import { jwtExpirySeconds } from './jwt.js';

export function startupConfig(env: NodeJS.ProcessEnv = process.env) {
  const port = Number(env.PORT?.trim() || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT; expected 1..65535.');
  const host = env.HOST?.trim() || '127.0.0.1';
  const secret = env.JWT_SECRET?.trim();
  if (!secret) throw new Error('Missing required JWT_SECRET.');
  if (env.NODE_ENV === 'production' && secret.length < 32) throw new Error('Production requires a JWT_SECRET of at least 32 characters.');
  jwtExpirySeconds(env.JWT_EXPIRES_IN);
  httpPolicy(env);
  return { port, host };
}

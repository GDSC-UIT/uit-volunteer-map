export interface HttpPolicy { origins: string[]; loginMax: number; loginWindowMs: number; }
export function httpPolicy(env: NodeJS.ProcessEnv = process.env): HttpPolicy {
  const production = env.NODE_ENV === 'production';
  const configured = env.CORS_ORIGINS?.trim();
  if (production && !configured) throw new Error('Production requires explicit CORS_ORIGINS.');
  const origins = (configured || 'http://localhost:3001,http://127.0.0.1:3001').split(',').map(value => value.trim());
  for (const origin of origins) {
    let parsed: URL;
    try { parsed = new URL(origin); } catch { throw new Error('CORS_ORIGINS must contain exact HTTP(S) origins.'); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin || parsed.hostname.includes('*')) throw new Error('CORS_ORIGINS must contain exact HTTP(S) origins without paths or wildcards.');
  }
  const integer = (name: string, fallback: number, max: number) => {
    const raw = env[name]?.trim();
    const value = raw ? Number(raw) : fallback;
    if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new Error(`Invalid ${name}.`);
    return value;
  };
  return { origins: [...new Set(origins)], loginMax: integer('LOGIN_RATE_LIMIT_MAX', 10, 1000),
    loginWindowMs: integer('LOGIN_RATE_LIMIT_WINDOW_SECONDS', 900, 86400) * 1000 };
}

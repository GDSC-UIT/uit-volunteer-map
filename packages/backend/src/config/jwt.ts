/** Bare values are seconds; explicit s/m/h/d units are also supported. */
export function jwtExpirySeconds(raw = process.env.JWT_EXPIRES_IN): number {
  const value = raw?.trim() || '1h';
  const match = /^(\d+)(s|m|h|d)?$/.exec(value);
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  const seconds = match ? Number(match[1]) * units[match[2] ?? 's'] : NaN;
  if (!Number.isSafeInteger(seconds) || seconds <= 0) {
    throw new Error('Invalid JWT_EXPIRES_IN. Use positive integer seconds or an integer with s/m/h/d (default 1h).');
  }
  return seconds;
}

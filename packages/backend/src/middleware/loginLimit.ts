import type { RequestHandler } from 'express';

/** Process-local, bounded failed-login budget. The app deliberately does not trust X-Forwarded-For. */
export function loginLimit({ max, windowMs, maxKeys = 10_000, now = Date.now }: {
  max: number; windowMs: number; maxKeys?: number; now?: () => number;
}): RequestHandler {
  const buckets = new Map<string, { used: number; reset: number }>();
  let sweepAt = 0;
  return (req, res, next) => {
    const time = now();
    if (time >= sweepAt) {
      for (const [key, bucket] of buckets) if (bucket.reset <= time) buckets.delete(key);
      sweepAt = time + Math.min(windowMs, 60_000);
    }
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let bucket = buckets.get(key);
    if (bucket && bucket.reset <= time) { buckets.delete(key); bucket = undefined; }
    if (!bucket && buckets.size < maxKeys) { bucket = { used: 0, reset: time + windowMs }; buckets.set(key, bucket); }
    if (!bucket || bucket.used >= max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil(((bucket?.reset ?? time + windowMs) - time) / 1000))));
      res.status(429).json({ success: false, error: 'Đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.' });
      return;
    }
    bucket.used++;
    const reserved = bucket;
    res.once('finish', () => {
      if (res.statusCode < 400 || res.statusCode >= 500) reserved.used = Math.max(0, reserved.used - 1);
    });
    next();
  };
}

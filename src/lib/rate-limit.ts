type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function now(): number {
  return Date.now();
}

/**
 * Minimal in-memory sliding-window rate limiter.
 * Suitable for a single instance. For multi-instance deployments swap this
 * for a shared store (Redis) with the same interface.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const bucket = buckets.get(key);
  const t = now();
  if (!bucket || bucket.resetAt <= t) {
    buckets.set(key, { count: 1, resetAt: t + windowMs });
    return true;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return false;
  }
  return true;
}

export function loginRateLimit(key: string): boolean {
  return rateLimit(`login:${key}`, 10, 15 * 60 * 1000);
}

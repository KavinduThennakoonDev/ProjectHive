// Small in-memory limiter for login attempts. It resets when the server
// restarts and is per-instance, which is enough for a single internal tool.

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map<string, { count: number; resetAt: number }>();

/** Seconds to wait before trying again, or 0 when the attempt is allowed. */
export function getRetryAfterSeconds(key: string, now: number = Date.now()): number {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) return 0;
  return entry.count >= MAX_ATTEMPTS ? Math.ceil((entry.resetAt - now) / 1000) : 0;
}

export function recordFailedAttempt(key: string, now: number = Date.now()): void {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}

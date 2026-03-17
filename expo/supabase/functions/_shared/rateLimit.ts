/**
 * Persistent rate limiter backed by PostgreSQL.
 * Survives Edge Function restarts and works across instances.
 *
 * Falls back to in-memory if DB call fails (fail-open with logging).
 * Requires: rate_limits table + check_rate_limit() function from migration 004.
 */

import { supabaseAdmin } from './supabaseAdmin.ts';

// In-memory fallback for when DB is unavailable
type Entry = { count: number; resetAt: number };
const fallbackBuckets = new Map<string, Entry>();

/**
 * Check if a request is within the rate limit.
 * @returns `true` if allowed, `false` if rate-limited.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  try {
    // Calculate fixed window start for consistency
    const windowStart = new Date(
      Math.floor(Date.now() / windowMs) * windowMs
    ).toISOString();

    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_key: key,
      p_window_start: windowStart,
      p_max: max,
    });

    if (error) {
      console.error('[rateLimit] DB check failed, using fallback:', error.message);
      return checkRateLimitFallback(key, max, windowMs);
    }

    return data as boolean;
  } catch (err) {
    console.error('[rateLimit] Unexpected error, using fallback:', err);
    return checkRateLimitFallback(key, max, windowMs);
  }
}

/**
 * Synchronous compatibility wrapper for callers that haven't migrated to async.
 * @deprecated Use the async checkRateLimit() instead.
 */
export function checkRateLimitSync(key: string, max: number, windowMs: number): boolean {
  return checkRateLimitFallback(key, max, windowMs);
}

/** In-memory fallback rate limiter (same logic as original) */
function checkRateLimitFallback(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = fallbackBuckets.get(key);

  if (!entry || now > entry.resetAt) {
    fallbackBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Cleanup stale fallback entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fallbackBuckets) {
    if (now > entry.resetAt) fallbackBuckets.delete(key);
  }
}, 5 * 60_000);

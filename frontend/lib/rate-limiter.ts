interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window cache
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  isLocked?: boolean;
}

/**
 * Check if a key is currently locked out WITHOUT incrementing the counter.
 */
export function checkRateLimitStatus(
  key: string,
  maxRequests: number
): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (!existing || now > existing.resetAt) {
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      resetSeconds: 0,
      isLocked: false,
    };
  }

  if (existing.count >= maxRequests) {
    const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds,
      isLocked: true,
    };
  }

  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    success: true,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - existing.count),
    resetSeconds,
    isLocked: false,
  };
}

/**
 * Record a failed authentication attempt.
 * If failures reach maxRequests, the key is locked out for lockoutSeconds (e.g. 3600s = 1 hr).
 */
export function recordFailedAttempt(
  key: string,
  maxRequests: number,
  lockoutSeconds: number = 3600
): RateLimitResult {
  const now = Date.now();
  const lockoutMs = lockoutSeconds * 1000;
  const existing = rateLimitMap.get(key);

  if (!existing || now > existing.resetAt) {
    // First failed attempt starts a 1-hour rolling window
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + lockoutMs,
    });
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetSeconds: lockoutSeconds,
      isLocked: false,
    };
  }

  existing.count += 1;
  // If limit reached or exceeded, ensure full lockout duration is enforced
  if (existing.count >= maxRequests) {
    existing.resetAt = now + lockoutMs;
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds: lockoutSeconds,
      isLocked: true,
    };
  }

  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    success: true,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - existing.count),
    resetSeconds,
    isLocked: false,
  };
}

/**
 * Reset rate limit counter upon successful authentication
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/**
 * General rate limit for single-request checkpoints (e.g. signup)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = rateLimitMap.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetSeconds: windowSeconds,
    };
  }

  if (existing.count >= maxRequests) {
    const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds,
    };
  }

  existing.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - existing.count,
    resetSeconds,
  };
}

/**
 * Helper to extract client IP from Next.js Request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

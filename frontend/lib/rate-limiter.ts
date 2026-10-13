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
}

/**
 * Check rate limit for an identifier (e.g. IP + Action)
 * @param key unique identifier (e.g. "login:127.0.0.1")
 * @param maxRequests maximum allowed requests within window
 * @param windowSeconds time window in seconds
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
    // New window
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

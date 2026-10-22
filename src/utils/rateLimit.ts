import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

export function checkRateLimit(
  request: NextRequest,
  options: {
    limit?: number; // max requests
    windowMs?: number; // time window in milliseconds
    prefix?: string;
  } = {}
): { allowed: boolean; remaining: number; reset: number; response?: NextResponse } {
  const defaultLimit = process.env.NODE_ENV === "production" ? 30 : 500;
  const limit = options.limit
    ? (process.env.NODE_ENV === "production" ? options.limit : Math.max(options.limit, 500))
    : defaultLimit;
  const windowMs = options.windowMs || 60000; // default 1 minute
  const prefix = options.prefix || "global";

  // Identify client by IP (or forward header)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const key = `${prefix}:${ip}`;

  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, reset: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    const response = NextResponse.json(
      {
        error: "Too many requests. Please wait before attempting again.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(record.resetAt),
        },
      }
    );
    return { allowed: false, remaining: 0, reset: retryAfter, response };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    reset: Math.ceil((record.resetAt - now) / 1000),
  };
}

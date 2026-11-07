import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/utils/db";

export async function checkRateLimit(
  request: NextRequest,
  options: {
    limit?: number; // max requests
    windowMs?: number; // time window in milliseconds
    prefix?: string;
  } = {}
): Promise<{ allowed: boolean; remaining: number; reset: number; response?: NextResponse }> {
  const defaultLimit = process.env.NODE_ENV === "production" ? 30 : 500;
  const limit = options.limit
    ? (process.env.NODE_ENV === "production" ? options.limit : Math.max(options.limit, 500))
    : defaultLimit;
  const windowMs = options.windowMs || 60000; // default 1 minute
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const prefix = options.prefix || "global";

  // Identify client by IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const isLoopback = ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
  const effectiveLimit = isLoopback ? 10000 : limit;
  const key = `${prefix}:${ip}`;

  try {
    const { rows } = await pool.query(
      `SELECT public.check_rate_limit($1, $2, $3) as result`,
      [key, effectiveLimit, windowSeconds]
    );

    const res = rows[0]?.result;
    if (res && res.allowed === false) {
      const retryAfter = Math.max(1, Number(res.reset_seconds || 1));
      const response = NextResponse.json(
        {
          error: "Too many requests. Please wait before attempting again.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(effectiveLimit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Date.now() + retryAfter * 1000),
          },
        }
      );
      return { allowed: false, remaining: 0, reset: retryAfter, response };
    }

    return {
      allowed: true,
      remaining: res?.remaining ?? (effectiveLimit - 1),
      reset: res?.reset_seconds ?? windowSeconds,
    };
  } catch (err) {
    // Fail open in case of transient DB pool issues so rate limiting does not block legitimate users
    console.warn("Distributed rate limit fallback:", err);
    return { allowed: true, remaining: effectiveLimit - 1, reset: windowSeconds };
  }
}

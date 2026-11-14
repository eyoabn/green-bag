import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { pool } from "@/utils/db";

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function extractClientIp(request: NextRequest): string {
  // Prefer platform-set single-IP headers before X-Forwarded-For
  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  if (vercelIp) return vercelIp;
  if (cfIp) return cfIp;
  if (realIp) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Use rightmost hop appended by trusted reverse proxy rather than spoofable leftmost client header
    const parts = forwardedFor
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }

  return "unknown";
}

function buildRateLimitResponse(limit: number, retryAfter: number): NextResponse {
  return NextResponse.json(
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
        "X-RateLimit-Reset": String(Date.now() + retryAfter * 1000),
      },
    }
  );
}

function checkMemoryRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetSeconds: windowSeconds };
  }
  existing.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) {
    return { allowed: false, remaining: 0, resetSeconds };
  }
  return { allowed: true, remaining: Math.max(0, limit - existing.count), resetSeconds };
}

export async function checkRateLimit(
  request: NextRequest,
  options: {
    limit?: number;
    windowMs?: number;
    prefix?: string;
    identifier?: string;
  } = {}
): Promise<{ allowed: boolean; remaining: number; reset: number; response?: NextResponse }> {
  const defaultLimit = process.env.NODE_ENV === "production" ? 30 : 500;
  const limit = options.limit
    ? (process.env.NODE_ENV === "production" ? options.limit : Math.max(options.limit, 500))
    : defaultLimit;
  const windowMs = options.windowMs || 60000;
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const prefix = options.prefix || "global";

  const ip = extractClientIp(request);
  const identHash = options.identifier
    ? `:${createHash("sha256").update(options.identifier.toLowerCase()).digest("hex").slice(0, 16)}`
    : "";
  const key = `${prefix}:${ip}${identHash}`;

  try {
    const { rows } = await pool.query(
      `SELECT public.check_rate_limit($1, $2, $3) as result`,
      [key, limit, windowSeconds]
    );

    const res = rows[0]?.result;
    if (res && res.allowed === false) {
      const retryAfter = Math.max(1, Number(res.reset_seconds || 1));
      return {
        allowed: false,
        remaining: 0,
        reset: retryAfter,
        response: buildRateLimitResponse(limit, retryAfter),
      };
    }

    return {
      allowed: true,
      remaining: res?.remaining ?? Math.max(0, limit - 1),
      reset: res?.reset_seconds ?? windowSeconds,
    };
  } catch (err) {
    // Fall back to in-memory per-instance rate limiter rather than failing completely open
    console.warn("Distributed rate limit fallback to memory:", err);
    const mem = checkMemoryRateLimit(key, limit, windowSeconds);
    if (!mem.allowed) {
      return {
        allowed: false,
        remaining: 0,
        reset: mem.resetSeconds,
        response: buildRateLimitResponse(limit, mem.resetSeconds),
      };
    }
    return { allowed: true, remaining: mem.remaining, reset: mem.resetSeconds };
  }
}

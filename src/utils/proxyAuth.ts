import { createHmac, timingSafeEqual } from "crypto";

const PROXY_SECRET =
  process.env.INTERNAL_PROXY_SECRET ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "gw_edge_proxy_hmac_secret_44f19b";

/**
 * Generates an HMAC-SHA256 signature for user identity claims injected by Edge Middleware.
 */
export function signProxyUser(userId: string, role: string, isActive: boolean): string {
  return createHmac("sha256", PROXY_SECRET)
    .update(`${userId}:${role}:${isActive ? "true" : "false"}`)
    .digest("hex");
}

/**
 * Validates an HMAC-SHA256 signature to guarantee headers were generated
 * by internal middleware and not spoofed by an external HTTP client.
 */
export function verifyProxyUser(
  userId: string,
  role: string,
  isActive: boolean,
  signature: string | null
): boolean {
  if (!signature || typeof signature !== "string") return false;
  try {
    const expected = signProxyUser(userId, role, isActive);
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

// Helper to check if a string is a valid UUID
export function isValidUUID(id?: string): boolean {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Deterministically generate a spec-compliant UUID v4-format string from a seed string.
 * - Segment 3 starts with '4' (version 4)
 * - Segment 4 starts with '8', '9', 'a', or 'b' (RFC 4122 variant bits)
 */
export function toValidUUID(seed?: string): string {
  if (seed && isValidUUID(seed)) {
    return seed;
  }

  // Generate a deterministic 32-char hex string from the seed
  const str = seed || "arenguade-user-seed";
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const a = (h1 >>> 0).toString(16).padStart(8, "0");
  const b = (h2 >>> 0).toString(16).padStart(8, "0");
  const combined = (a + b).padEnd(32, "0");

  // Force version=4 and variant=8..b (RFC 4122)
  const seg3 = "4" + combined.slice(13, 16);
  const variantNibble = (parseInt(combined[16], 16) & 0x3 | 0x8).toString(16);
  const seg4 = variantNibble + combined.slice(17, 20);

  return [
    combined.slice(0, 8),
    combined.slice(8, 12),
    seg3,
    seg4,
    combined.slice(20, 32),
  ].join("-");
}

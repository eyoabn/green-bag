// Helper to check if a string is a valid UUID
export function isValidUUID(id?: string): boolean {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Deterministically generate a valid UUID v4-like string from an identifier
export function toValidUUID(seed?: string): string {
  if (seed && isValidUUID(seed)) {
    return seed;
  }
  let hash = 0;
  const str = seed || "arenguade-user-seed";
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `${hex.slice(0, 8)}-4222-4222-8222-${hex.padEnd(12, "0").slice(0, 12)}`;
}

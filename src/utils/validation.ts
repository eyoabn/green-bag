import { z } from "zod";
import { isValidUUID } from "@/utils/uuid";

export { isValidUUID };

/**
 * Sanitizes redirect / returnTo paths to prevent Open Redirects and javascript: XSS.
 * Only permits local relative paths starting with a single '/'.
 */
export function sanitizeRelativeRedirect(
  target: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!target || typeof target !== "string") return fallback;
  const trimmed = target.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }
  // Reject control characters or embedded schemes
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return fallback;
  try {
    const parsed = new URL(trimmed, "https://internal.local");
    if (parsed.origin !== "https://internal.local") {
      return fallback;
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}

/**
 * Validates that a URL is strictly http(s) or a safe relative path starting with '/'.
 * Blocks javascript:, data:, vbscript:, file:, etc.
 */
export function isSafeHttpOrRelativeUrl(val: string | null | undefined): boolean {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return false;

  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//") && !trimmed.startsWith("/\\");
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function sanitizeHref(val: string | null | undefined, fallback = "/"): string {
  return isSafeHttpOrRelativeUrl(val) ? String(val).trim() : fallback;
}

/**
 * Validates a storage object path or qr-ref path to prevent path traversal
 * and cross-user UUID prefix spoofing.
 */
export function isValidStoragePathForUser(
  path: string | null | undefined,
  userId: string,
  role: string,
  options: { allowQrRef?: boolean; allowDraftSentinel?: boolean } = {}
): boolean {
  if (!path || typeof path !== "string") return false;
  const trimmed = path.trim();
  if (!trimmed || trimmed.length > 512) return false;
  if (/[\x00-\x1f\x7f\\]/.test(trimmed)) return false;

  if (options.allowDraftSentinel && trimmed === "spec-draft-pending-artwork") {
    return true;
  }
  if (options.allowQrRef && trimmed.startsWith("qr-ref://")) {
    const ref = trimmed.slice("qr-ref://".length).trim();
    return ref.length > 0 && ref.length <= 200 && !/[<>]/.test(ref);
  }

  // Block path traversal and schemes
  if (trimmed.startsWith("/") || trimmed.includes("..") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return false;
  }

  // If the first path segment is a UUID, enforce that it belongs to the caller (unless admin)
  const firstSegment = trimmed.split("/")[0];
  if (isValidUUID(firstSegment) && role !== "admin" && firstSegment !== userId) {
    return false;
  }

  return /^[a-zA-Z0-9._/-]+$/.test(trimmed);
}

export const safeHttpUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const u = new URL(val);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "URL must use http:// or https://." }
  );

export const safeRelativeOrHttpUrlSchema = z
  .string()
  .trim()
  .refine((val) => !val || isSafeHttpOrRelativeUrl(val), {
    message: "Link must be a relative path or an http(s) URL.",
  });

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address format."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const SignupSchema = z.object({
  email: z.string().email("Invalid email address format."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
  fullName: z.string().min(2, "Full name must be at least 2 characters.").max(100),
  phone: z.string().min(9, "Phone number must be at least 9 digits.").max(30).optional().or(z.literal("")),
});

export const OrderItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID."),
  quantity: z.number().int().positive("Quantity must be a positive integer.").max(10000),
});

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, "Order must contain at least one item."),
  bankAccountId: z.string().uuid("Invalid bank account selection."),
  deliveryAddress: z.string().min(5, "Delivery address must be provided.").max(500),
  phone: z.string().min(9, "Phone number must be at least 9 digits.").max(30),
  notes: z.string().max(1000).optional(),
  paymentProofPath: z.string().max(512).optional(),
  buyerId: z.string().uuid().optional(),
});

export const SubmitDesignSchema = z.object({
  title: z.string().min(3, "Design title must be at least 3 characters.").max(200),
  description: z.string().min(5, "Description must be at least 5 characters.").max(4000),
  filePath: z.string().min(1, "Uploaded dieline file path is required.").max(512),
});

export const CreateClassSessionSchema = z.object({
  type: z.enum(["in_person", "live"]),
  title: z.string().min(3, "Workshop title must be at least 3 characters.").max(200),
  description: z.string().max(2000).optional().default(""),
  teacher_id: z.string().uuid("Teacher ID must be a valid UUID.").optional(),
  location: z.string().max(300).optional().default(""),
  starts_at: z.string().datetime("Start time must be a valid ISO datetime."),
  ends_at: z.string().datetime("End time must be a valid ISO datetime.").optional(),
  capacity: z.number().int().min(1, "Capacity must be at least 1 student.").max(500),
  price: z.number().min(0, "Price cannot be negative.").max(1000000),
});

export const BankAccountSchema = z.object({
  bank_name: z.string().min(2, "Bank name must be at least 2 characters.").max(120),
  account_name: z.string().min(2, "Account holder name is required.").max(120),
  account_number: z.string().min(5, "Account number must be valid.").max(80),
  instructions: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
});

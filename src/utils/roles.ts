import { createClient } from "@/utils/supabase/server";

export type UserRole = "customer" | "teacher" | "admin";

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  role: UserRole;
  is_active: boolean;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * Server-side helper to require an authenticated active user.
 * Throws AuthError(401) if not authenticated.
 * Throws AuthError(403) if account is deactivated.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Authentication required", 401);
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url, role, is_active")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    // If profile hasn't been populated by trigger yet, fallback to default customer
    return {
      id: user.id,
      email: user.email || "",
      full_name: (user.user_metadata?.full_name as string) || "Valued User",
      phone: (user.user_metadata?.phone as string) || "",
      avatar_url: "",
      role: "customer",
      is_active: true,
    };
  }

  if (!profile.is_active) {
    throw new AuthError("Your account has been deactivated. Please contact support.", 403);
  }

  return {
    id: profile.id,
    email: user.email || "",
    full_name: profile.full_name || (user.user_metadata?.full_name as string) || "Valued User",
    phone: profile.phone || "",
    avatar_url: profile.avatar_url || "",
    role: (profile.role as UserRole) || "customer",
    is_active: profile.is_active,
  };
}

/**
 * Server-side helper to require specific roles.
 * Throws AuthError(403) if role is not allowed.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(`Forbidden: Requires one of [${allowedRoles.join(", ")}] permissions`, 403);
  }

  return user;
}

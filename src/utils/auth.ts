"use client";

import { createClient } from "@/utils/supabase/client";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: "customer" | "student" | "admin";
}

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

/**
 * Universally retrieves the currently authenticated user.
 * Tries:
 * 1. Supabase Auth getUser()
 * 2. Supabase Auth getSession()
 * 3. Local storage `arenguade_user`
 * Ensures the returned user has a valid UUID format id.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = createClient();

  // 1. Try Supabase Auth getUser()
  try {
    const { data, error } = await supabase.auth.getUser();
    if (data?.user) {
      const u = data.user;
      let role: "customer" | "student" | "admin" = (u.user_metadata?.role as any) || "customer";
      let fullName = u.user_metadata?.full_name || u.email?.split("@")[0] || "Valued User";
      let phone = u.user_metadata?.phone || "";

      // Try fetching profile
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, phone")
          .eq("id", u.id)
          .maybeSingle();

        if (profile) {
          if (profile.role) role = profile.role as any;
          if (profile.full_name) fullName = profile.full_name;
          if (profile.phone) phone = profile.phone;
        }
      } catch {}

      const appUser: AppUser = {
        id: u.id,
        email: u.email || "",
        full_name: fullName,
        phone,
        role,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("arenguade_user", JSON.stringify(appUser));
      }
      return appUser;
    }
  } catch (err) {
    console.warn("Supabase auth.getUser() check skipped:", err);
  }

  // 2. Try Supabase Auth getSession()
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const u = session.user;
      const appUser: AppUser = {
        id: u.id,
        email: u.email || "",
        full_name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Valued User",
        phone: u.user_metadata?.phone || "",
        role: (u.user_metadata?.role as any) || "customer",
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("arenguade_user", JSON.stringify(appUser));
      }
      return appUser;
    }
  } catch (err) {
    console.warn("Supabase auth.getSession() check skipped:", err);
  }

  // 3. Fallback to localStorage session
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("arenguade_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.id || parsed.email)) {
          const validId = isValidUUID(parsed.id) ? parsed.id : toValidUUID(parsed.email || parsed.id);
          const appUser: AppUser = {
            id: validId,
            email: parsed.email || "user@arenguade.et",
            full_name: parsed.full_name || parsed.fullName || parsed.email?.split("@")[0] || "Valued Customer",
            phone: parsed.phone || "",
            role: parsed.role || "customer",
          };
          return appUser;
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Stores the user in localStorage and dispatches an auth change event
 */
export function setLocalUser(user: AppUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("arenguade_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("arenguade_user");
    localStorage.removeItem("arenguade_admin_authenticated");
    sessionStorage.removeItem("arenguade_admin_authenticated");
  }
  window.dispatchEvent(new Event("arenguade_auth_change"));
}

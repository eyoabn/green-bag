// Shared auth utility — usable in both Client Components and Server contexts.
// Do NOT add "use client" here; this file is imported from both sides.

import { createClient } from "@/utils/supabase/client";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: "customer" | "teacher" | "admin";
  avatar_url?: string;
  is_active?: boolean;
}

import { isValidUUID, toValidUUID } from "@/utils/uuid";
export { isValidUUID, toValidUUID };

/**
 * Universally retrieves the currently authenticated user from the server / Supabase Auth.
 * Never trusts client user_metadata.role or localStorage as an authorization source.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  // In browser, authoritative server verification via /api/profile ensures cookie & DB accuracy
  if (typeof window !== "undefined") {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch("/api/profile", { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json?.profile) {
          const p = json.profile;
          const appUser: AppUser = {
            id: p.id,
            email: p.email || "",
            full_name: p.fullName || p.email?.split("@")[0] || "Valued User",
            phone: p.phone || "",
            role: (p.role as AppUser["role"]) || "customer",
            avatar_url: p.avatarUrl,
            is_active: p.isActive,
          };
          localStorage.setItem("arenguade_user", JSON.stringify(appUser));
          return appUser;
        }
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("arenguade_user");
        return null;
      }
    } catch {
      // Fall through to Supabase Auth client check
    }
  }

  const supabase = createClient();

  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const u = data.user;
      let role: AppUser["role"] = "customer";
      let fullName = u.user_metadata?.full_name || u.email?.split("@")[0] || "Valued User";
      let phone = u.user_metadata?.phone || "";
      let isActive = true;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, phone, is_active")
          .eq("id", u.id)
          .maybeSingle();
        if (profile) {
          if (profile.role) role = profile.role as AppUser["role"];
          if (profile.full_name) fullName = profile.full_name;
          if (profile.phone) phone = profile.phone;
          if (profile.is_active === false) isActive = false;
        }
      } catch {}

      if (!isActive) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("arenguade_user");
        }
        return null;
      }

      const appUser: AppUser = { id: u.id, email: u.email || "", full_name: fullName, phone, role, is_active: isActive };
      if (typeof window !== "undefined") {
        localStorage.setItem("arenguade_user", JSON.stringify(appUser));
      }
      return appUser;
    }
  } catch (err) {
    console.warn("Supabase auth.getUser() skipped:", err);
  }

  return null;
}

export function getLocalUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("arenguade_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && (parsed.id || parsed.email)) {
        const validId = isValidUUID(parsed.id) ? parsed.id : toValidUUID(parsed.email || parsed.id);
        return {
          id: validId,
          email: parsed.email || "user@arenguade.et",
          full_name: parsed.full_name || parsed.fullName || parsed.email?.split("@")[0] || "Valued User",
          phone: parsed.phone || "",
          role: parsed.role || "customer",
          avatar_url: parsed.avatar_url,
          is_active: parsed.is_active,
        };
      }
    }
  } catch {}
  return null;
}

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

export async function signOutUser() {
  const supabase = createClient();
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}
  try {
    await supabase.auth.signOut();
  } catch {}
  setLocalUser(null);
}

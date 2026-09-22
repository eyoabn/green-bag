import fs from "fs";
import path from "path";
import crypto from "crypto";
import { toValidUUID } from "@/utils/uuid";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export interface PlatformUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  full_name: string;
  phone: string;
  role: "admin" | "customer" | "student";
  created_at: string;
  status: "active" | "verified";
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  return createSupabaseClient(url, key);
}

// Initial default seed accounts
function getInitialUsers(): PlatformUser[] {
  const salt1 = crypto.randomBytes(16).toString("hex");
  const salt2 = crypto.randomBytes(16).toString("hex");
  const salt3 = crypto.randomBytes(16).toString("hex");
  const salt4 = crypto.randomBytes(16).toString("hex");

  return [
    {
      id: "bcc8f197-159c-4c69-a777-a2c00bdd1c47",
      email: "joabniguise@gmail.com",
      passwordHash: hashPassword("password123", salt1),
      salt: salt1,
      full_name: "Eyoab Niguise",
      phone: "0911000001",
      role: "admin",
      created_at: "2026-09-17T10:00:00.000Z",
      status: "verified",
    },
    {
      id: "354605a8-91a6-4a42-924b-d932e2b5aa64",
      email: "eyoabniguise@gmail.com",
      passwordHash: hashPassword("password123", salt2),
      salt: salt2,
      full_name: "Eyoab Niguise (Owner)",
      phone: "0911000002",
      role: "admin",
      created_at: "2026-09-17T11:00:00.000Z",
      status: "verified",
    },
    {
      id: "04aee2d7-c774-4008-930d-72a84e5d46f3",
      email: "tadesse@oromiaroast.et",
      passwordHash: hashPassword("password123", salt3),
      salt: salt3,
      full_name: "Tadesse Gemechu",
      phone: "0911223344",
      role: "customer",
      created_at: "2026-09-17T17:54:15.514Z",
      status: "verified",
    },
    {
      id: "26645f1f-cec8-4219-be8b-5522fc94e3b3",
      email: "test.customer@arenguade.et",
      passwordHash: hashPassword("password123", salt4),
      salt: salt4,
      full_name: "Test Customer",
      phone: "0911001122",
      role: "customer",
      created_at: "2026-09-18T15:44:12.319Z",
      status: "verified",
    },
  ];
}

export class UserStore {
  private static ensureStore(): PlatformUser[] {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(USERS_FILE)) {
        const initial = getInitialUsers();
        fs.writeFileSync(USERS_FILE, JSON.stringify(initial, null, 2), "utf-8");
        return initial;
      }
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      const initial = getInitialUsers();
      fs.writeFileSync(USERS_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    } catch (err) {
      console.warn("UserStore read warning:", err);
      return getInitialUsers();
    }
  }

  private static saveUsers(users: PlatformUser[]): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    } catch (err) {
      console.error("UserStore write error:", err);
    }
  }

  public static getAllUsers(): PlatformUser[] {
    return this.ensureStore();
  }

  public static findByEmail(email: string): PlatformUser | null {
    const trimmed = String(email).trim().toLowerCase();
    const users = this.ensureStore();
    return users.find((u) => u.email.toLowerCase() === trimmed) || null;
  }

  public static findById(id: string): PlatformUser | null {
    const users = this.ensureStore();
    return users.find((u) => u.id === id) || null;
  }

  public static verifyPassword(user: PlatformUser, plainPassword: string): boolean {
    if (!user.salt || !user.passwordHash) return false;
    const computed = hashPassword(plainPassword, user.salt);
    return computed === user.passwordHash;
  }

  public static async registerUser(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: "admin" | "customer" | "student";
  }): Promise<PlatformUser> {
    const users = this.ensureStore();
    const trimmedEmail = data.email.trim().toLowerCase();

    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === trimmedEmail);
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(data.password, salt);
    const id = existingIndex >= 0 ? users[existingIndex].id : toValidUUID(trimmedEmail);

    const newUser: PlatformUser = {
      id,
      email: trimmedEmail,
      passwordHash,
      salt,
      full_name: data.fullName.trim(),
      phone: data.phone || "",
      role: data.role,
      created_at: new Date().toISOString(),
      status: "verified",
    };

    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.unshift(newUser);
    }

    this.saveUsers(users);

    // Sync to Supabase profiles table
    try {
      const supabase = getSupabaseClient();
      await supabase.from("profiles").upsert({
        id,
        full_name: newUser.full_name,
        phone: newUser.phone,
        role: newUser.role,
      });
    } catch (supaErr) {
      console.warn("Supabase profile sync note:", supaErr);
    }

    return newUser;
  }

  public static async updateUserRole(
    userId: string,
    newRole: "admin" | "customer" | "student"
  ): Promise<PlatformUser | null> {
    const users = this.ensureStore();
    const user = users.find((u) => u.id === userId);
    if (!user) return null;

    user.role = newRole;
    this.saveUsers(users);

    // Sync to Supabase
    try {
      const supabase = getSupabaseClient();
      await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    } catch (err) {
      console.warn("Supabase role update note:", err);
    }

    return user;
  }

  public static async deleteUser(userId: string): Promise<boolean> {
    let users = this.ensureStore();
    const initialLen = users.length;
    users = users.filter((u) => u.id !== userId);
    if (users.length === initialLen) return false;

    this.saveUsers(users);

    try {
      const supabase = getSupabaseClient();
      await supabase.from("profiles").delete().eq("id", userId);
    } catch (err) {
      console.warn("Supabase delete note:", err);
    }

    return true;
  }
}

import { pool } from "@/utils/db";

/**
 * Dispatch an in-app notification to a specific user via server pool.
 */
export async function notifyUser({
  userId,
  title,
  body,
  link = "",
}: {
  userId: string;
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO public.notifications (user_id, title, body, link)
       VALUES ($1, $2, $3, $4)`,
      [userId, title, body, link]
    );
  } catch (err) {
    console.error("Failed to insert user notification:", err);
  }
}

/**
 * Dispatch an in-app notification to all active administrators via server pool.
 */
export async function notifyAdmins({
  title,
  body,
  link = "",
}: {
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  try {
    const { rows: admins } = await pool.query(
      `SELECT id FROM public.profiles WHERE role = 'admin' AND is_active = true`
    );
    if (!admins || admins.length === 0) return;

    await pool.query(
      `INSERT INTO public.notifications (user_id, title, body, link)
       SELECT id, $1, $2, $3
       FROM public.profiles
       WHERE role = 'admin' AND is_active = true`,
      [title, body, link]
    );
  } catch (err) {
    console.error("Failed to dispatch admin notifications:", err);
  }
}

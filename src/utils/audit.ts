import { pool } from "@/utils/db";

export interface AuditEventParams {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Centrally log administrative and security events into public.audit_log.
 * Bypasses RLS safely via server PostgreSQL pool.
 */
export async function logAuditEvent({
  actorId,
  action,
  entity,
  entityId = null,
  metadata = {},
}: AuditEventParams): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO public.audit_log (actor_id, action, entity, entity_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [actorId, action, entity, entityId ? String(entityId) : null, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error("Failed to write audit log event:", err);
  }
}

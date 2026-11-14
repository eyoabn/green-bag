import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";
import { logAuditEvent } from "@/utils/audit";
import { notifyAdmins, notifyUser } from "@/utils/notifications";
import { isValidUUID, isValidStoragePathForUser } from "@/utils/validation";

async function isProofPathReusedByOtherUser(path: string, userId: string): Promise<boolean> {
  const res = await pool.query(
    `
    SELECT 1 FROM public.enrollments WHERE payment_proof_path = $1 AND student_id <> $2
    UNION ALL
    SELECT 1 FROM public.orders WHERE payment_proof_path = $1 AND buyer_id <> $2
    LIMIT 1
    `,
    [path, userId]
  );
  return res.rows.length > 0;
}

// GET /api/enrollments - List enrollments with role isolation
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const statusFilter = searchParams.get("status");

    if (sessionId && !isValidUUID(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID format." }, { status: 400 });
    }

    if (
      statusFilter &&
      statusFilter !== "all" &&
      !["pending_verification", "approved", "rejected", "cancelled"].includes(statusFilter)
    ) {
      return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
    }

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (statusFilter && statusFilter !== "all") {
      conditions.push(`e.status = $${idx++}`);
      params.push(statusFilter);
    }

    if (user.role === "admin") {
      if (sessionId) {
        conditions.push(`e.session_id = $${idx++}`);
        params.push(sessionId);
      }
    } else if (user.role === "teacher") {
      if (sessionId) {
        const sessRes = await pool.query(
          "SELECT teacher_id FROM public.class_sessions WHERE id = $1 LIMIT 1",
          [sessionId]
        );
        const sess = sessRes.rows[0];
        if (!sess || sess.teacher_id !== user.id) {
          return NextResponse.json(
            { error: "Forbidden: You are not the assigned teacher for this class session." },
            { status: 403 }
          );
        }
        conditions.push(`e.session_id = $${idx++}`);
        params.push(sessionId);
      } else {
        conditions.push(`cs.teacher_id = $${idx++}`);
        params.push(user.id);
      }
    } else {
      conditions.push(`e.student_id = $${idx++}`);
      params.push(user.id);
      if (sessionId) {
        conditions.push(`e.session_id = $${idx++}`);
        params.push(sessionId);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const res = await pool.query(
      `
      SELECT
        e.id, e.session_id, e.student_id, e.status, e.payment_proof_path,
        e.rejection_reason, e.verified_by, e.verified_at, e.attended,
        e.created_at, e.updated_at,
        cs.id AS cs_id, cs.title AS cs_title, cs.type AS cs_type, cs.price AS cs_price,
        cs.starts_at AS cs_starts_at, cs.ends_at AS cs_ends_at, cs.capacity AS cs_capacity,
        cs.teacher_id AS cs_teacher_id, cs.location AS cs_location, cs.status AS cs_status,
        p.id AS student_profile_id, p.full_name AS student_full_name,
        p.email AS student_email, p.phone AS student_phone
      FROM public.enrollments e
      LEFT JOIN public.class_sessions cs ON cs.id = e.session_id
      LEFT JOIN public.profiles p ON p.id = e.student_id
      ${whereClause}
      ORDER BY e.created_at DESC
      `,
      params
    );

    const enrollments = res.rows.map((row: any) => ({
      id: row.id,
      session_id: row.session_id,
      student_id: row.student_id,
      status: row.status,
      payment_proof_path: row.payment_proof_path,
      rejection_reason: row.rejection_reason,
      verified_by: row.verified_by,
      verified_at: row.verified_at,
      attended: row.attended,
      created_at: row.created_at,
      updated_at: row.updated_at,
      class_sessions: row.cs_id
        ? {
            id: row.cs_id,
            title: row.cs_title,
            type: row.cs_type,
            price: row.cs_price,
            starts_at: row.cs_starts_at,
            ends_at: row.cs_ends_at,
            capacity: row.cs_capacity,
            teacher_id: row.cs_teacher_id,
            location: row.cs_location,
            status: row.cs_status,
          }
        : null,
      profiles: row.student_profile_id
        ? {
            id: row.student_profile_id,
            full_name: row.student_full_name,
            email: row.student_email,
            phone: row.student_phone,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      enrollments,
    });
  } catch (err: any) {
    console.error("Load enrollments error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to load enrollments" },
      { status }
    );
  }
}

// POST /api/enrollments - Atomic class registration using PostgreSQL RPC
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const { sessionId, paymentProofPath } = body;

    if (!sessionId || !isValidUUID(sessionId)) {
      return NextResponse.json({ error: "A valid class session ID is required." }, { status: 400 });
    }

    const cleanProofPath = typeof paymentProofPath === "string" ? paymentProofPath.trim() : "";
    if (cleanProofPath) {
      if (!isValidStoragePathForUser(cleanProofPath, user.id, user.role)) {
        return NextResponse.json({ error: "Invalid payment proof file path." }, { status: 400 });
      }
      if (await isProofPathReusedByOtherUser(cleanProofPath, user.id)) {
        return NextResponse.json({ error: "Invalid or already-claimed payment proof path." }, { status: 400 });
      }
    }

    const supabase = await createClient();

    const { data: rpcResult, error: rpcErr } = await supabase.rpc("create_enrollment", {
      p_session_id: sessionId,
      p_student_id: user.id,
      p_payment_proof_path: cleanProofPath,
    });

    if (rpcErr) {
      const msg = rpcErr.message || "";
      if (msg.includes("already_enrolled")) {
        return NextResponse.json(
          { error: "You already have an active registration for this class." },
          { status: 400 }
        );
      }
      if (msg.includes("session_full")) {
        return NextResponse.json(
          { error: "Sorry, this session is full." },
          { status: 400 }
        );
      }
      if (msg.includes("session_in_past")) {
        return NextResponse.json(
          { error: "Cannot register for a past session." },
          { status: 400 }
        );
      }
      if (msg.includes("session_cancelled")) {
        return NextResponse.json(
          { error: "Cannot register for a cancelled session." },
          { status: 400 }
        );
      }
      if (msg.includes("session_not_found")) {
        return NextResponse.json(
          { error: "Class session not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: "Registration could not be completed." }, { status: 400 });
    }

    const enrollmentId = rpcResult?.enrollment_id;
    let enrollment: any = null;
    if (enrollmentId && isValidUUID(enrollmentId)) {
      const enrRes = await pool.query(
        `
        SELECT
          e.id, e.session_id, e.student_id, e.status, e.payment_proof_path,
          cs.id AS cs_id, cs.title AS cs_title, cs.price AS cs_price,
          cs.starts_at AS cs_starts_at, cs.ends_at AS cs_ends_at
        FROM public.enrollments e
        LEFT JOIN public.class_sessions cs ON cs.id = e.session_id
        WHERE e.id = $1
        LIMIT 1
        `,
        [enrollmentId]
      );
      const row = enrRes.rows[0];
      if (row) {
        enrollment = {
          id: row.id,
          session_id: row.session_id,
          student_id: row.student_id,
          status: row.status,
          payment_proof_path: row.payment_proof_path,
          class_sessions: row.cs_id
            ? {
                id: row.cs_id,
                title: row.cs_title,
                price: row.cs_price,
                starts_at: row.cs_starts_at,
                ends_at: row.cs_ends_at,
              }
            : null,
        };
      }
    }

    if (cleanProofPath) {
      const title = enrollment?.class_sessions?.title || "Workshop";
      await notifyAdmins({
        title: "Class Enrollment Payment to Verify",
        body: `${user.full_name} submitted payment receipt for "${title}".`,
        link: "/admin/payments?tab=enrollments",
      });
    }

    return NextResponse.json({
      success: true,
      result: rpcResult,
      enrollment,
    });
  } catch (err: any) {
    console.error("Create enrollment error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Registration failed" },
      { status }
    );
  }
}

// PATCH /api/enrollments - Verify payment, cancel enrollment, or mark attendance
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const { enrollmentId, action, status, rejectionReason, attended, paymentProofPath } = body;

    if (!enrollmentId || !isValidUUID(enrollmentId)) {
      return NextResponse.json({ error: "A valid Enrollment ID is required." }, { status: 400 });
    }

    const fetchRes = await pool.query(
      `
      SELECT
        e.*,
        cs.id AS cs_id, cs.title AS cs_title, cs.teacher_id AS cs_teacher_id, cs.price AS cs_price
      FROM public.enrollments e
      LEFT JOIN public.class_sessions cs ON cs.id = e.session_id
      WHERE e.id = $1
      LIMIT 1
      `,
      [enrollmentId]
    );

    const row = fetchRes.rows[0];
    if (!row) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }

    const enrollment = {
      ...row,
      class_sessions: row.cs_id
        ? {
            id: row.cs_id,
            title: row.cs_title,
            teacher_id: row.cs_teacher_id,
            price: row.cs_price,
          }
        : null,
    };

    // 1. CUSTOMER ACTIONS
    if (user.role === "customer") {
      if (enrollment.student_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: Not your enrollment." }, { status: 403 });
      }

      if (action === "approve") {
        return NextResponse.json({ error: "Forbidden: Customers cannot approve enrollments." }, { status: 403 });
      }

      if (action === "cancel") {
        if (!["pending_verification", "rejected"].includes(enrollment.status)) {
          return NextResponse.json(
            {
              error:
                enrollment.status === "approved"
                  ? "Approved registrations cannot be cancelled online. Please contact admin."
                  : "This registration cannot be cancelled in its current status.",
            },
            { status: 400 }
          );
        }

        const updateRes = await pool.query(
          `
          UPDATE public.enrollments
          SET status = 'cancelled', updated_at = NOW()
          WHERE id = $1 AND student_id = $2 AND status IN ('pending_verification', 'rejected')
          RETURNING *
          `,
          [enrollmentId, user.id]
        );
        if (updateRes.rowCount === 0) {
          return NextResponse.json({ error: "Enrollment status changed concurrently." }, { status: 409 });
        }
        return NextResponse.json({ success: true, enrollment: updateRes.rows[0] });
      }

      if (action === "upload_proof") {
        if (!["pending_verification", "rejected"].includes(enrollment.status)) {
          return NextResponse.json(
            { error: "Cannot upload payment receipt for cancelled or already approved enrollments." },
            { status: 400 }
          );
        }

        const cleanProofPath = typeof paymentProofPath === "string" ? paymentProofPath.trim() : "";
        if (!cleanProofPath || !isValidStoragePathForUser(cleanProofPath, user.id, user.role)) {
          return NextResponse.json({ error: "A valid receipt file path is required." }, { status: 400 });
        }
        if (await isProofPathReusedByOtherUser(cleanProofPath, user.id)) {
          return NextResponse.json({ error: "Invalid or already-claimed payment receipt path." }, { status: 400 });
        }

        const updateRes = await pool.query(
          `
          UPDATE public.enrollments
          SET payment_proof_path = $3,
              status = 'pending_verification',
              rejection_reason = NULL,
              updated_at = NOW()
          WHERE id = $1 AND student_id = $2 AND status IN ('pending_verification', 'rejected')
          RETURNING *
          `,
          [enrollmentId, user.id, cleanProofPath]
        );
        if (updateRes.rowCount === 0) {
          return NextResponse.json({ error: "Enrollment cannot be updated in its current state." }, { status: 409 });
        }

        const title = enrollment.class_sessions?.title || "Workshop";
        await notifyAdmins({
          title: "Re-uploaded Enrollment Receipt",
          body: `${user.full_name} re-submitted payment receipt for "${title}".`,
          link: "/admin/payments?tab=enrollments",
        });

        return NextResponse.json({ success: true, enrollment: updateRes.rows[0] });
      }

      return NextResponse.json({ error: "Invalid action for student." }, { status: 400 });
    }

    // 2. TEACHER ACTIONS (Mark Attendance & Accept Students)
    if (user.role === "teacher") {
      const teacherId = enrollment.class_sessions?.teacher_id;
      const sessionTitle = enrollment.class_sessions?.title;
      const sessionPrice = Number(enrollment.class_sessions?.price || 0);

      if (teacherId !== user.id) {
        return NextResponse.json(
          { error: "Forbidden: You are not the assigned instructor for this class." },
          { status: 403 }
        );
      }

      if (action === "approve") {
        if (enrollment.status !== "pending_verification") {
          return NextResponse.json(
            { error: "Only pending registrations can be approved." },
            { status: 400 }
          );
        }
        if (sessionPrice > 0 && !enrollment.payment_proof_path) {
          return NextResponse.json(
            { error: "Paid registrations require a payment proof before approval." },
            { status: 400 }
          );
        }

        const updateRes = await pool.query(
          `
          UPDATE public.enrollments
          SET status = 'approved',
              verified_by = $2,
              verified_at = NOW(),
              rejection_reason = NULL,
              updated_at = NOW()
          WHERE id = $1 AND status = 'pending_verification'
          RETURNING *
          `,
          [enrollmentId, user.id]
        );
        if (updateRes.rowCount === 0) {
          return NextResponse.json({ error: "Enrollment is no longer pending verification." }, { status: 409 });
        }

        await notifyUser({
          userId: enrollment.student_id,
          title: "Registration Approved by Instructor!",
          body: `Your seat for "${sessionTitle || "Class Session"}" has been approved by your teacher. You are ready to join!`,
          link: "/dashboard?tab=classes",
        });

        await logAuditEvent({
          actorId: user.id,
          action: "ENROLLMENT_TEACHER_APPROVED",
          entity: "enrollments",
          entityId: enrollmentId,
          metadata: { teacher_id: user.id, session_id: enrollment.session_id },
        });

        return NextResponse.json({ success: true, enrollment: updateRes.rows[0] });
      }

      if (action === "attendance") {
        if (enrollment.status === "cancelled" || enrollment.status === "rejected") {
          return NextResponse.json(
            { error: "Cannot mark attendance for cancelled or rejected enrollments." },
            { status: 400 }
          );
        }
        const updateRes = await pool.query(
          `
          UPDATE public.enrollments
          SET attended = $2, updated_at = NOW()
          WHERE id = $1
          RETURNING *
          `,
          [enrollmentId, Boolean(attended)]
        );
        return NextResponse.json({ success: true, enrollment: updateRes.rows[0] });
      }

      return NextResponse.json(
        { error: "Teachers can only mark attendance or accept students." },
        { status: 400 }
      );
    }

    // 3. ADMIN ACTIONS (Approve, Reject, Attendance)
    if (user.role === "admin") {
      const setClauses: string[] = ["updated_at = NOW()"];
      const values: any[] = [enrollmentId];
      const auditMetadata: Record<string, any> = {};
      let paramIdx = 2;

      if (action === "approve") {
        setClauses.push(`status = 'approved'`);
        setClauses.push(`verified_by = $${paramIdx++}`);
        values.push(user.id);
        setClauses.push(`verified_at = NOW()`);
        setClauses.push(`rejection_reason = NULL`);
        auditMetadata.status = "approved";
      } else if (action === "reject") {
        if (!rejectionReason || !String(rejectionReason).trim()) {
          return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
        }
        const reason = String(rejectionReason).trim().slice(0, 500);
        setClauses.push(`status = 'rejected'`);
        setClauses.push(`rejection_reason = $${paramIdx++}`);
        values.push(reason);
        setClauses.push(`verified_by = $${paramIdx++}`);
        values.push(user.id);
        setClauses.push(`verified_at = NOW()`);
        auditMetadata.status = "rejected";
        auditMetadata.rejection_reason = reason;
      } else if (action === "attendance") {
        setClauses.push(`attended = $${paramIdx++}`);
        values.push(Boolean(attended));
        auditMetadata.attended = Boolean(attended);
      } else if (action === "cancel") {
        setClauses.push(`status = 'cancelled'`);
        auditMetadata.status = "cancelled";
      } else if (status) {
        if (!["pending_verification", "approved", "rejected", "cancelled"].includes(status)) {
          return NextResponse.json({ error: "Invalid enrollment status." }, { status: 400 });
        }
        setClauses.push(`status = $${paramIdx++}`);
        values.push(status);
        auditMetadata.status = status;
      } else {
        return NextResponse.json({ error: "Invalid admin action." }, { status: 400 });
      }

      const updateRes = await pool.query(
        `
        UPDATE public.enrollments
        SET ${setClauses.join(", ")}
        WHERE id = $1
        RETURNING *
        `,
        values
      );

      if (action === "approve" || action === "reject") {
        await notifyUser({
          userId: enrollment.student_id,
          title: `Class Registration ${action === "approve" ? "Approved" : "Rejected"}`,
          body:
            action === "approve"
              ? `Your seat for "${enrollment.class_sessions?.title}" is confirmed! You can now join this session.`
              : `Your registration payment was rejected: "${String(rejectionReason).trim()}". Please re-upload your receipt.`,
          link: "/dashboard/classes",
        });
      }

      await logAuditEvent({
        actorId: user.id,
        action: `ENROLLMENT_${(action || status || "UPDATE").toUpperCase()}`,
        entity: "enrollments",
        entityId: enrollmentId,
        metadata: auditMetadata,
      });

      return NextResponse.json({ success: true, enrollment: updateRes.rows[0] });
    }

    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  } catch (err: any) {
    console.error("Update enrollment error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to update enrollment" },
      { status }
    );
  }
}

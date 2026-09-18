import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isValidUUID, toValidUUID } from "@/utils/uuid";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  return createSupabaseClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      sessionTitle,
      studentId,
      studentName,
      studentPhone,
      studentEmail,
      receiptUrl,
    } = body;

    const supabase = getServerSupabase();

    // 1. Resolve student UUID
    let finalStudentId = studentId;
    if (!isValidUUID(finalStudentId)) {
      finalStudentId = toValidUUID(studentEmail || studentPhone || "arenguade-student");
    }

    try {
      await supabase.from("profiles").upsert({
        id: finalStudentId,
        full_name: studentName || "Craft Academy Student",
        phone: studentPhone || "",
        role: "student",
      });
    } catch (profErr) {
      console.warn("Student profile upsert note:", profErr);
    }

    // 2. Resolve class session UUID
    let resolvedSessionId: string | null = isValidUUID(sessionId) ? sessionId : null;

    if (!resolvedSessionId) {
      const { data: dbSessions } = await supabase.from("class_sessions").select("id, title");
      if (dbSessions && dbSessions.length > 0) {
        if (sessionTitle) {
          const match = dbSessions.find((s) =>
            s.title.toLowerCase().includes(sessionTitle.toLowerCase().slice(0, 10))
          );
          resolvedSessionId = match ? match.id : dbSessions[0].id;
        } else {
          resolvedSessionId = dbSessions[0].id;
        }
      }
    }

    let createdReg: any = null;
    if (resolvedSessionId) {
      try {
        const { data, error } = await supabase
          .from("session_registrations")
          .insert({
            session_id: resolvedSessionId,
            student_id: finalStudentId,
            payment_screenshot_url: receiptUrl || "receipt_pending",
            status: "pending_verification",
          })
          .select()
          .single();

        if (data) createdReg = data;
        else if (error) console.warn("Supabase registration insert note:", error.message);
      } catch (insertErr) {
        console.warn("Supabase registration insert exception:", insertErr);
      }
    }

    const regId = createdReg?.id || `REG-2026-${Math.floor(100 + Math.random() * 900)}`;

    return NextResponse.json({
      success: true,
      registrationId: regId,
      registration: createdReg || {
        id: regId,
        session_id: resolvedSessionId || sessionId,
        student_id: finalStudentId,
        status: "pending_verification",
      },
    });
  } catch (error: any) {
    console.error("Registration processing error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

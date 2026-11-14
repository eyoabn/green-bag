import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket") || "payment-proofs";
    const path = searchParams.get("path")?.trim() || "";

    if (!path) {
      return NextResponse.json({ error: "File path is required." }, { status: 400 });
    }

    if (
      path.length > 512 ||
      path.includes("..") ||
      path.includes("\\") ||
      path.startsWith("/") ||
      !/^[a-zA-Z0-9._/-]+$/.test(path)
    ) {
      return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
    }

    if (!["payment-proofs", "designs"].includes(bucket)) {
      return NextResponse.json({ error: "Invalid bucket." }, { status: 400 });
    }

    // If user is not admin, enforce ownership check via pool (avoids .maybeSingle() duplicate errors and checks all linked tables)
    if (user.role !== "admin") {
      let authorized = path.startsWith(`${user.id}/`);

      if (!authorized && bucket === "payment-proofs") {
        const res = await pool.query(
          `
          SELECT 1 FROM public.orders WHERE payment_proof_path = $1 AND buyer_id = $2
          UNION ALL
          SELECT 1 FROM public.enrollments WHERE payment_proof_path = $1 AND student_id = $2
          UNION ALL
          SELECT 1 FROM public.designs WHERE submitted_by = $2 AND specs_json->>'payment_proof_url' = $1
          LIMIT 1
          `,
          [path, user.id]
        );
        authorized = res.rows.length > 0;
      } else if (!authorized && bucket === "designs") {
        const res = await pool.query(
          `
          SELECT 1 FROM public.designs
          WHERE submitted_by = $2 AND (file_path = $1 OR specs_json->>'payment_proof_url' = $1)
          LIMIT 1
          `,
          [path, user.id]
        );
        authorized = res.rows.length > 0;
      }

      if (!authorized) {
        return NextResponse.json(
          { error: "Access denied: You do not own this protected file." },
          { status: 403 }
        );
      }
    }

    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 15);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      signedUrl: data?.signedUrl,
    });
  } catch (err: any) {
    console.error("Signed URL generation error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to generate signed URL" },
      { status }
    );
  }
}

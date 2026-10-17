import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket") || "payment-proofs";
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "File path is required." }, { status: 400 });
    }

    if (!["payment-proofs", "designs"].includes(bucket)) {
      return NextResponse.json({ error: "Invalid bucket." }, { status: 400 });
    }

    const supabase = await createClient();

    // If user is not admin, enforce ownership check
    if (user.role !== "admin") {
      let authorized = false;

      if (bucket === "payment-proofs") {
        // Check order ownership
        const { data: order } = await supabase
          .from("orders")
          .select("buyer_id")
          .eq("payment_proof_path", path)
          .maybeSingle();

        if (order && order.buyer_id === user.id) {
          authorized = true;
        }

        // Check enrollment ownership
        if (!authorized) {
          const { data: enrollment } = await supabase
            .from("enrollments")
            .select("student_id")
            .eq("payment_proof_path", path)
            .maybeSingle();

          if (enrollment && enrollment.student_id === user.id) {
            authorized = true;
          }
        }
      } else if (bucket === "designs") {
        const { data: design } = await supabase
          .from("designs")
          .select("submitted_by")
          .eq("file_path", path)
          .maybeSingle();

        if (design && design.submitted_by === user.id) {
          authorized = true;
        }
      }

      if (!authorized) {
        return NextResponse.json({ error: "Access denied: You do not own this protected file." }, { status: 403 });
      }
    }

    // Generate signed URL (expires in 15 minutes)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 15);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      signedUrl: data?.signedUrl,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to generate signed URL" }, { status });
  }
}

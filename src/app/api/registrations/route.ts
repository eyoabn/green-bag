import { NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";

export async function POST() {
  try {
    await requireUser();
    return NextResponse.json(
      { error: "This legacy registration endpoint has been retired. Please use /api/enrollments." },
      { status: 410 }
    );
  } catch (err: any) {
    const status = err?.status || 401;
    return NextResponse.json({ error: err?.message || "Authentication required" }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireRole } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "payment-proofs";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!["product-images", "payment-proofs", "designs"].includes(bucket)) {
      return NextResponse.json({ error: "Invalid target storage bucket." }, { status: 400 });
    }

    // Role verification per bucket
    let user;
    if (bucket === "product-images") {
      user = await requireRole(["admin"]);
    } else {
      user = await requireUser();
    }

    // Server-side size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size of 5 MB (received ${(file.size / 1024 / 1024).toFixed(2)} MB).` },
        { status: 400 }
      );
    }

    // Server-side type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Allowed formats: JPG, PNG, WEBP, PDF." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanName = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = `${user.id}/${cleanName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    if (bucket === "product-images") {
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return NextResponse.json({
        success: true,
        filePath,
        url: publicData.publicUrl,
      });
    }

    // For private buckets, generate short-lived signed URL (15 minutes)
    const { data: signedData, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 15);

    if (signError) throw signError;

    return NextResponse.json({
      success: true,
      filePath,
      signedUrl: signedData?.signedUrl,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to upload file" }, { status });
  }
}

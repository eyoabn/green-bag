import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireRole } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/utils/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validates file binary header magic bytes to prevent MIME spoofing and malicious payloads.
 */
function inspectMagicBytes(buffer: Buffer): { mime: string; ext: string } | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  // PDF: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { mime: "application/pdf", ext: "pdf" };
  }

  return null;
}

export async function POST(request: NextRequest) {
  // Rate limit protection (20 uploads/minute)
  const rl = checkRateLimit(request, { limit: 20, windowMs: 60000, prefix: "upload" });
  if (!rl.allowed && rl.response) {
    return rl.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "payment-proofs";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!["product-images", "payment-proofs", "designs", "avatars"].includes(bucket)) {
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

    // Convert to buffer for binary inspection
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Deep binary magic-byte inspection
    const detected = inspectMagicBytes(buffer);
    if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
      return NextResponse.json(
        { error: "Invalid file binary content. Allowed formats: JPG, PNG, WEBP, PDF." },
        { status: 400 }
      );
    }

    // Strict bucket type restrictions: PDFs are not permitted for imagery
    if ((bucket === "product-images" || bucket === "avatars") && detected.mime === "application/pdf") {
      return NextResponse.json(
        { error: "PDF documents cannot be used as images or avatars." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sanitize user filename to alphanumeric characters and enforce verified canonical extension
    const rawBase = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 32);
    const safeBase = rawBase || "file";
    const cleanName = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeBase}.${detected.ext}`;
    const filePath = `${user.id}/${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: detected.mime,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    if (bucket === "product-images" || bucket === "avatars") {
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

/**
 * Utility for robust client-side file uploads with automatic image compression
 * and safe error handling for server payload limits (Vercel 4.5MB limit).
 */

export async function compressImageFile(
  file: File,
  maxDimension = 1920,
  quality = 0.85
): Promise<File> {
  // If not an image or if it's a PDF / SVG / GIF, don't attempt canvas compression
  if (!file.type.startsWith("image/") || file.type.includes("svg") || file.type.includes("gif")) {
    return file;
  }

  // If the image is already small (e.g. under 800 KB), no need to compress
  if (file.size <= 800 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize down if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image smoothly
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob (JPEG for high compression efficiency)
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compression didn't reduce size, stick to original
              resolve(file);
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], cleanFileName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export interface UploadResult {
  filePath: string;
  url?: string;
  signedUrl?: string;
}

export async function uploadFileSafely(
  file: File,
  bucket = "payment-proofs"
): Promise<UploadResult> {
  // 1. If it's a PDF or non-image exceeding 4.5 MB, prevent Vercel 413 crash
  if (file.size > 4.5 * 1024 * 1024 && !file.type.startsWith("image/")) {
    throw new Error(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 4.5 MB limit. Please upload a smaller document.`
    );
  }

  // 2. Automatically compress if it's a large image
  let fileToUpload = file;
  if (file.type.startsWith("image/")) {
    try {
      fileToUpload = await compressImageFile(file);
    } catch {
      fileToUpload = file;
    }
  }

  // 3. Final size check after compression
  if (fileToUpload.size > 4.5 * 1024 * 1024) {
    throw new Error(
      `Image is too large (${(fileToUpload.size / (1024 * 1024)).toFixed(1)} MB). Please select a file under 4.5 MB.`
    );
  }

  // 4. Send upload request
  const formData = new FormData();
  formData.append("file", fileToUpload);
  formData.append("bucket", bucket);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const responseText = await res.text();

  if (res.status === 413 || responseText.includes("Request Entity Too Large")) {
    throw new Error(
      "The uploaded file exceeds the server size limit. Please choose an image or document under 4.5 MB."
    );
  }

  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Server error (${res.status}): ${responseText.substring(0, 100) || res.statusText}`
    );
  }

  if (!res.ok || !data.filePath) {
    throw new Error(data.error || "Failed to upload file to cloud storage.");
  }

  return {
    filePath: data.filePath,
    url: data.url,
    signedUrl: data.signedUrl,
  };
}

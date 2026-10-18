"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  FileCheck, 
  Sparkles, 
  ArrowLeft,
  PenTool,
  Image as ImageIcon
} from "lucide-react";
import { uploadFileSafely } from "@/utils/fileUpload";
import { getCurrentUser } from "@/utils/auth";
import StickyBottomBar from "@/components/StickyBottomBar";

export default function DesignSubmissionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) {
        router.push("/login?returnTo=/design-submission");
      } else {
        setCurrentUser(u);
      }
    }).catch(() => {});
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(selected.type)) {
      setErrorMsg("Please upload a PDF, PNG, JPG, or WEBP design dieline.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg("File exceeds the 5 MB size limit.");
      return;
    }

    setErrorMsg(null);
    setFile(selected);

    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please upload your artwork, logo, or dieline file.");
      return;
    }
    if (!title.trim()) {
      setErrorMsg("Please enter a short project title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Upload file to 'designs' bucket
      const uploadRes = await uploadFileSafely(file, "designs");
      if (!uploadRes.filePath) {
        throw new Error("Failed to upload design artwork.");
      }

      // 2. Submit to /api/designs
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          filePath: uploadRes.filePath,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record design submission.");
      }

      setSubmittedId(data.design?.id || "submitted");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation screen
  if (submittedId) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#F9F6F0] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">
            Design Received
          </h1>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            Our master packaging engineers have received your dieline for <strong className="text-stone-900">{title}</strong>. We will review print specs and post your quotation directly in your portal.
          </p>

          <Link
            href="/dashboard?tab=designs"
            className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2"
          >
            <span>Track in Account Portal</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-28 md:pb-20 bg-[#F9F6F0]">
      <div className="max-w-xl mx-auto px-4 sm:px-6 w-full">
        
        {/* Navigation Breadcrumb */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#8C4B31] transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] text-xs font-bold uppercase tracking-wider mb-2">
            <PenTool size={13} />
            <span>Custom Manufacturing</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Submit Custom Design
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Upload your logo, vector dieline, or reference sketch. Our engineers will review paper grammage and deliver a formal quotation within 24 hours.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          
          {/* 1. Project Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-900 mb-2">
              Project / Brand Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Addis Specialty Coffee 250g Gusset Pouch"
              className="form-input"
            />
          </div>

          {/* 2. File Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-900 mb-2">
              Artwork or Dieline File *
            </label>
            
            <label className="border-2 border-dashed border-stone-300 hover:border-[#1E3B2E] bg-[#FAF7F2] hover:bg-white rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload size={28} className="text-[#1E3B2E] mb-2" />
              {file ? (
                <div>
                  <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                    <FileCheck size={16} />
                    <span>{file.name}</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB • Tap to change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-stone-800">
                    Choose from camera or gallery
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Supports PDF, PNG, JPG, or WEBP (up to 5 MB)
                  </p>
                </div>
              )}
            </label>

            {/* Thumbnail Preview */}
            {filePreview && (
              <div className="mt-3 p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
                <img
                  src={filePreview}
                  alt="Artwork preview"
                  className="w-16 h-16 object-cover rounded-xl border border-stone-200"
                />
                <span className="text-xs text-stone-600 font-medium">Artwork preview ready for upload</span>
              </div>
            )}
          </div>

          {/* 3. Specification Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-900 mb-2">
              Dimensions & Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Desired bag dimensions (26x32x10cm), 220 GSM kraft paper, twisted paper handles, gold foil stamped logo."
              rows={4}
              className="form-input min-h-[100px]"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !file || !title.trim()}
              className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Sparkles size={16} className="animate-spin" />
                  <span>Submitting Artwork...</span>
                </>
              ) : (
                <span>Submit for Quotation</span>
              )}
            </button>
            <p className="text-[11px] text-center text-stone-500 mt-3 font-medium">
              Free quotation. No commitment required until you approve pricing.
            </p>
          </div>
        </form>

      </div>

      <StickyBottomBar>
        <button
          type="button"
          onClick={() => {
            const form = document.querySelector("form");
            if (form) form.requestSubmit();
          }}
          disabled={isSubmitting || !file || !title.trim()}
          className="btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit for Quotation"}
        </button>
      </StickyBottomBar>
    </div>
  );
}

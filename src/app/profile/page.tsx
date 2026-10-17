"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Camera, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState("customer");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login?returnTo=/profile");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.profile) {
          setEmail(data.profile.email || "");
          setFullName(data.profile.fullName || "");
          setPhone(data.profile.phone || "");
          setAvatarUrl(data.profile.avatarUrl || "");
          setRole(data.profile.role || "customer");
        }
      })
      .catch((err) => {
        setErrorMessage(err?.message || "Failed to load profile details.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload avatar image.");
      }

      setAvatarUrl(data.url);
      setSuccessMessage("Avatar uploaded! Save profile to finalize changes.");
    } catch (err: any) {
      setErrorMessage(err?.message || "Avatar upload failed.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save profile changes.");
      }

      setSuccessMessage("Profile updated successfully!");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const getPortalLink = () => {
    if (role === "admin") return { href: "/admin", label: "Admin Operations" };
    if (role === "teacher") return { href: "/teacher", label: "Teacher Studio" };
    return { href: "/dashboard", label: "Customer Dashboard" };
  };

  const portal = getPortalLink();

  if (loading) {
    return (
      <div className="flex min-h-screen pt-24 pb-16 bg-[#F9F6F0] items-center justify-center">
        <div className="flex items-center gap-3 text-stone-600 font-semibold text-sm">
          <div className="w-5 h-5 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin" />
          <span>Loading Account Details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href={portal.href}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to {portal.label}</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#1E3B2E] px-8 py-8 text-white relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#E0B382] block mb-1">
                  Account Management
                </span>
                <h1 className="font-serif text-3xl font-bold text-white">Your Profile</h1>
                <p className="text-xs text-stone-300 mt-1">
                  Manage your personal contact details, photo, and notification preferences.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-[#E0B382]">
                <ShieldCheck size={14} />
                <span>Role: {role.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-stone-100">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-stone-100 border-2 border-stone-200 flex items-center justify-center text-stone-400">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={38} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-[#1E3B2E] text-white hover:bg-[#8C4B31] shadow-md transition-colors cursor-pointer"
                    title="Change profile avatar"
                  >
                    <Camera size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-stone-900 text-sm">Profile Avatar</h3>
                  <p className="text-stone-500 text-[11px] mt-0.5 mb-2">
                    Supports JPG, PNG or WEBP up to 5 MB.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="text-xs font-semibold px-4 py-1.5 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    {uploadingAvatar ? "Uploading..." : "Upload New Photo"}
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full p-3 bg-stone-100 border border-stone-300 rounded-xl text-stone-500 cursor-not-allowed font-mono"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Contact support to update your primary email address.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    System Role (Read-Only)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={role.toUpperCase()}
                    className="w-full p-3 bg-stone-100 border border-stone-300 rounded-xl text-stone-700 font-bold cursor-not-allowed"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Role permissions are strictly managed by system administrators.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Full Legal / Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Abebe Bikila"
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Phone Number (SMS / Dispatch)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 911 000 000"
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-stone-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-stone-100">
                <Link
                  href={portal.href}
                  className="text-stone-500 hover:text-stone-800 font-semibold"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#1E3B2E] hover:bg-[#8C4B31] disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-full tracking-wider uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <span>Saving Changes...</span>
                  ) : (
                    <>
                      <span>Save Profile Details</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

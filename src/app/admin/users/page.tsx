"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Calendar, 
  UserPlus, 
  X, 
  Check, 
  Trash2, 
  AlertCircle, 
  Sparkles,
  ShoppingBag,
  BookOpen
} from "lucide-react";

type PlatformUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "admin" | "customer" | "student";
  created_at: string;
  status: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"customer" | "student" | "admin">("customer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setUsers(resJson.users || []);
      } else {
        throw new Error(resJson?.error || "Failed to load platform users");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load registered accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "customer" | "student") => {
    setActionSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const resJson = await res.json();

      if (res.ok && resJson?.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setActionSuccess(`Role updated to ${newRole.toUpperCase()} successfully.`);
        setTimeout(() => setActionSuccess(""), 3000);
      } else {
        alert(resJson?.error || "Failed to update role");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update user role");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword || "arenguade2026",
          fullName: newFullName.trim(),
          phone: newPhone.trim(),
          role: newRole,
        }),
      });
      const resJson = await res.json();

      if (res.ok && resJson?.success && resJson?.user) {
        setShowAddModal(false);
        setNewFullName("");
        setNewEmail("");
        setNewPhone("");
        setNewPassword("");
        setNewRole("customer");
        setActionSuccess(`User ${resJson.user.full_name} (${resJson.user.role}) added successfully.`);
        fetchUsers();
      } else {
        setModalError(resJson?.error || "Failed to create user account.");
      }
    } catch (err: any) {
      setModalError(err?.message || "Network error creating user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove account "${userName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      const resJson = await res.json();

      if (res.ok && resJson?.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setActionSuccess(`Account "${userName}" has been removed.`);
        setTimeout(() => setActionSuccess(""), 3000);
      } else {
        alert(resJson?.error || "Failed to delete user.");
      }
    } catch (err: any) {
      alert(err?.message || "Error deleting user.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-3">
        <div className="w-9 h-9 rounded-full border-3 border-[#1E3B2E] border-t-transparent animate-spin" />
        <span className="text-xs text-stone-500 font-semibold">Loading platform users & roles...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Stats & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} />
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 tracking-tight">Registered Platform Users</h1>
          <p className="text-stone-500 text-xs mt-1">
            Real registered platform accounts with dynamic role classifications and clearance management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-stone-200 text-stone-700 text-xs font-bold shadow-xs">
            <Users size={15} className="text-[#1E3B2E]" />
            <span>{users.length} Total Users</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Add User / Admin</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs border border-emerald-200 flex items-center gap-2 font-medium">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs border border-red-200 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4 font-bold">User Identity</th>
                <th className="px-6 py-4 font-bold">Contact Details</th>
                <th className="px-6 py-4 font-bold">Assigned Role</th>
                <th className="px-6 py-4 font-bold">Role Classification</th>
                <th className="px-6 py-4 font-bold">Registered On</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold font-serif text-sm shadow-xs ${
                        user.role === "admin"
                          ? "bg-red-900 text-white"
                          : user.role === "student"
                          ? "bg-[#8C4B31] text-white"
                          : "bg-[#1E3B2E] text-white"
                      }`}>
                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-900 text-sm">{user.full_name || "Valued User"}</span>
                        <span className="text-[11px] text-stone-400 font-mono">{user.email || user.id.slice(0, 16)}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-stone-600">
                    <div className="space-y-1">
                      {user.email && (
                        <div className="flex items-center gap-1.5 text-stone-700">
                          <Mail size={13} className="text-stone-400" />
                          <span>{user.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                        <Phone size={13} className="text-stone-400" />
                        <span>{user.phone || "No phone registered"}</span>
                      </div>
                    </div>
                  </td>

                  {/* Role Badge */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-2xs ${
                      user.role === "admin"
                        ? "bg-red-50 text-red-800 border border-red-200"
                        : user.role === "student"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}>
                      {user.role === "admin" && <ShieldCheck size={13} className="text-red-700" />}
                      {user.role === "student" && <BookOpen size={13} className="text-amber-700" />}
                      {user.role === "customer" && <ShoppingBag size={13} className="text-emerald-700" />}
                      <span>{user.role === "admin" ? "Plant Admin" : user.role === "student" ? "Academy Student" : "Packaging Buyer"}</span>
                    </span>
                  </td>

                  {/* Inline Role Modifier */}
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                      className="bg-stone-50 border border-stone-200 text-stone-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]/30 font-medium cursor-pointer"
                    >
                      <option value="customer">Buyer (customer)</option>
                      <option value="student">Student (student)</option>
                      <option value="admin">Administrator (admin)</option>
                    </select>
                  </td>

                  <td className="px-6 py-4 text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-stone-400" />
                      <span>{new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user.id, user.full_name)}
                      className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove User"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                    No registered platform accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add User / Admin */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-stone-200 relative animate-fadeIn">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1 rounded-xl"
            >
              <X size={18} />
            </button>

            <div className="mb-5">
              <h2 className="font-serif text-xl font-bold text-stone-900">Provision User Account</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Register a new customer, student, or executive administrator.
              </p>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Almaz Ayana"
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="almaz@domain.et"
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0911002233"
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Default: arenguade2026"
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Assigned Platform Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole("customer")}
                    className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      newRole === "customer"
                        ? "bg-[#1E3B2E] text-white border-[#1E3B2E]"
                        : "bg-stone-50 text-stone-700 border-stone-200"
                    }`}
                  >
                    Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole("student")}
                    className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      newRole === "student"
                        ? "bg-[#8C4B31] text-white border-[#8C4B31]"
                        : "bg-stone-50 text-stone-700 border-stone-200"
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole("admin")}
                    className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      newRole === "admin"
                        ? "bg-red-900 text-white border-red-950"
                        : "bg-stone-50 text-stone-700 border-stone-200"
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Provisioning..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

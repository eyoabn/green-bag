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
  AlertCircle, 
  Sparkles,
  Search,
  BookOpen,
  ShoppingBag,
  ShieldAlert,
  Power
} from "lucide-react";

type PlatformUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "admin" | "teacher" | "customer";
  created_at: string;
  is_active: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modal State for Provisioning
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("Password123!");
  const [newRole, setNewRole] = useState<"customer" | "teacher" | "admin">("teacher");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/admin/users";
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
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

  const handleRoleChange = async (userId: string, newRole: "admin" | "teacher" | "customer") => {
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
        setTimeout(() => setActionSuccess(""), 3500);
      } else {
        alert(resJson?.error || "Failed to update role");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update user role");
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setActionSuccess("");
    const newStatus = !currentStatus;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, is_active: newStatus }),
      });
      const resJson = await res.json();

      if (res.ok && resJson?.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_active: newStatus } : u))
        );
        setActionSuccess(`User account ${newStatus ? "ACTIVATED" : "DEACTIVATED"} successfully.`);
        setTimeout(() => setActionSuccess(""), 3500);
      } else {
        alert(resJson?.error || "Failed to update account status");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to toggle user status");
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
          fullName: newFullName.trim(),
          email: newEmail.trim().toLowerCase(),
          phone: newPhone.trim(),
          password: newPassword,
          role: newRole,
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setShowAddModal(false);
        setNewFullName("");
        setNewEmail("");
        setNewPhone("");
        setNewPassword("Password123!");
        fetchUsers();
        setActionSuccess(`Account provisioned successfully for ${resJson.user.email} (${newRole.toUpperCase()})!`);
        setTimeout(() => setActionSuccess(""), 4000);
      } else {
        setModalError(resJson?.error || "Failed to provision user");
      }
    } catch (err: any) {
      setModalError(err?.message || "Connection error provisioning user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Identity & Security Management
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            Platform Users & Staff
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Realtime directory of clients, certified teachers, and plant administrators.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus size={15} />
          <span>Provision Teacher / Staff</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <Check size={16} className="text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-stone-200 rounded-full pl-9 pr-4 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["all", "customer", "teacher", "admin"].map((tab) => (
            <button
              key={tab}
              onClick={() => setRoleFilter(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                roleFilter === tab
                  ? "bg-[#1E3B2E] text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-stone-400 text-xs">
            <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading registered accounts...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <Users size={32} className="mx-auto text-stone-300 mb-2" />
            No platform users matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-[#FAF7F2] border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">User / Identity</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">System Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                          u.role === "admin" 
                            ? "bg-red-100 text-red-900 border border-red-200"
                            : u.role === "teacher"
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : "bg-[#1E3B2E]/10 text-[#1E3B2E] border border-stone-200"
                        }`}>
                          {u.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-xs leading-tight">
                            {u.full_name || "Valued User"}
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-stone-600">
                      {u.phone ? (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone size={11} className="text-stone-400" />
                          {u.phone}
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[10px] italic">No phone</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                        className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                          u.role === "admin"
                            ? "bg-red-50 text-red-900 border-red-200"
                            : u.role === "teacher"
                            ? "bg-amber-50 text-amber-900 border-amber-200"
                            : "bg-emerald-50 text-emerald-900 border-emerald-200"
                        }`}
                      >
                        <option value="customer">Customer (Buyer)</option>
                        <option value="teacher">Teacher (Instructor)</option>
                        <option value="admin">Admin (Plant Owner)</option>
                      </select>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-600" : "bg-red-600"}`} />
                        {u.is_active ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-stone-400 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                          u.is_active
                            ? "bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-800"
                            : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                        }`}
                        title={u.is_active ? "Deactivate User Access" : "Re-activate User"}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl relative animate-fadeIn">
            
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:bg-stone-100 text-stone-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-[#1E3B2E]/10 text-[#1E3B2E]">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Provision Staff Account</h3>
                <p className="text-[11px] text-stone-500">Create a certified teacher or staff user</p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Tigist Tadesse"
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="teacher@arenguade.com"
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+251 911 000 000"
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Account Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 font-bold"
                >
                  <option value="teacher">Teacher (Classroom Instructor)</option>
                  <option value="admin">Administrator (Full Control)</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
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

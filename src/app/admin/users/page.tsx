"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  X, 
  Check, 
  AlertCircle, 
  Lock,
  Power
} from "lucide-react";
import { getCurrentUser, AppUser } from "@/utils/auth";
import DataTable, { DataTableColumn } from "@/components/DataTable";

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
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

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
    getCurrentUser().then((u) => setCurrentUser(u)).catch(() => {});
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setIsError(false);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (activeFilter !== "all") params.set("active", activeFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setUsers(resJson.users || []);
        setTotalCount(resJson.totalCount ?? resJson.users?.length ?? 0);
      } else {
        throw new Error(resJson?.error || "Failed to load platform users");
      }
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err?.message || "Failed to load users from database");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, activeFilter, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: "admin" | "teacher" | "customer") => {
    if (currentUser?.id === userId && newRole !== "admin") {
      alert("Administrators cannot demote their own account.");
      return;
    }

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
    if (currentUser?.id === userId && currentStatus) {
      alert("Administrators cannot deactivate their own account.");
      return;
    }

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

  // Columns definition for DataTable
  const columns: DataTableColumn<PlatformUser>[] = [
    {
      header: "User Details",
      cell: (user) => {
        const isSelf = currentUser?.id === user.id;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1E3B2E]/10 border border-[#1E3B2E]/20 text-[#1E3B2E] flex items-center justify-center font-bold text-sm shrink-0">
              {user.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 truncate">{user.full_name || "Valued User"}</span>
                {isSelf && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    You
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-500 truncate">{user.email}</span>
              {user.phone && <span className="text-[11px] text-stone-400">{user.phone}</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: "Role Clearance",
      cell: (user) => {
        const isSelf = currentUser?.id === user.id;
        return (
          <div className="flex items-center gap-2">
            {isSelf ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold" title="You cannot demote your own admin clearance">
                <Lock size={12} className="text-amber-700" />
                <span>ADMIN (Locked)</span>
              </div>
            ) : (
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  user.role === "admin"
                    ? "bg-red-50 text-red-900 border-red-200"
                    : user.role === "teacher"
                    ? "bg-amber-50 text-amber-900 border-amber-200"
                    : "bg-stone-50 text-stone-700 border-stone-200"
                }`}
              >
                <option value="customer">CUSTOMER</option>
                <option value="teacher">TEACHER</option>
                <option value="admin">ADMIN</option>
              </select>
            )}
          </div>
        );
      },
    },
    {
      header: "Account Status",
      cell: (user) => {
        const isSelf = currentUser?.id === user.id;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleActive(user.id, user.is_active)}
              disabled={isSelf}
              title={isSelf ? "You cannot deactivate your own account" : `Click to ${user.is_active ? "deactivate" : "activate"}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSelf
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 opacity-80 cursor-not-allowed"
                  : user.is_active
                  ? "bg-emerald-50 hover:bg-red-50 text-emerald-800 hover:text-red-700 border border-emerald-200 hover:border-red-200 cursor-pointer"
                  : "bg-red-50 hover:bg-emerald-50 text-red-800 hover:text-emerald-700 border border-red-200 hover:border-emerald-200 cursor-pointer"
              }`}
            >
              <Power size={13} />
              <span>{user.is_active ? "Active" : "Inactive"}</span>
            </button>
          </div>
        );
      },
    },
    {
      header: "Registered",
      cell: (user) => (
        <span className="text-xs text-stone-500">
          {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Identity & Access Management
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            Platform Users & Staff
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage client accounts, assign certified teachers, and govern administrator clearance.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-[#E0B382] hover:text-white text-xs font-bold px-5 py-2.5 rounded-2xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus size={15} />
          <span>Provision Teacher / Staff</span>
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs font-semibold animate-in fade-in">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Reusable Data Table */}
      <DataTable<PlatformUser>
        columns={columns}
        data={users}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        searchValue={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email, or phone number..."
        filters={[
          {
            id: "role",
            label: "Role",
            value: roleFilter,
            options: [
              { label: "All Roles", value: "all" },
              { label: "Customer", value: "customer" },
              { label: "Teacher", value: "teacher" },
              { label: "Admin", value: "admin" },
            ],
            onChange: (val) => {
              setRoleFilter(val);
              setPage(1);
            },
          },
          {
            id: "active",
            label: "Status",
            value: activeFilter,
            options: [
              { label: "All Statuses", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
            onChange: (val) => {
              setActiveFilter(val);
              setPage(1);
            },
          },
        ]}
        isLoading={loading}
        isError={isError}
        errorMessage={errorMessage}
        onRetry={fetchUsers}
        emptyTitle="No platform users found"
        emptyMessage="Try adjusting your search criteria or role filters."
        keyExtractor={(u) => u.id}
      />

      {/* Modal for Provisioning User / Teacher */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1E3B2E]/10 flex items-center justify-center text-[#1E3B2E]">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">Provision Staff Account</h3>
                  <p className="text-[11px] text-stone-500">Register a new instructor or administrative associate</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Artisan Almaz"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. almaz@arenguadepaper.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+251 9..."
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Account Role *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none cursor-pointer"
                >
                  <option value="teacher">Certified Teacher / Workshop Instructor</option>
                  <option value="admin">Plant Administrator</option>
                  <option value="customer">Customer Buyer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  The user can update this password after initial sign in.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1E3B2E] text-[#E0B382] hover:bg-[#8C4B31] hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Provisioning..." : "Provision Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Plus, 
  Building2, 
  X, 
  AlertCircle, 
  Check, 
  Power, 
  Edit3, 
  Trash2, 
  HelpCircle 
} from "lucide-react";

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  instructions: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export default function AdminBankAccountsPage() {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Modal State (Create or Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  
  // Form State
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("Ethiopia Arenguade Paper Product PLC");
  const [accountNumber, setAccountNumber] = useState("");
  const [instructions, setInstructions] = useState("Use your Order Number as payment reference.");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchBanks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/bank-accounts");
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setBanks(resJson.accounts || []);
      } else {
        throw new Error(resJson?.error || "Failed to load bank accounts");
      }
    } catch (err: any) {
      setError(err?.message || "Error fetching bank accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const openCreateModal = () => {
    setEditingAccount(null);
    setBankName("");
    setAccountName("Ethiopia Arenguade Paper Product PLC");
    setAccountNumber("");
    setInstructions("Use your Order Number as payment reference.");
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (account: BankAccount) => {
    setEditingAccount(account);
    setBankName(account.bank_name);
    setAccountName(account.account_name);
    setAccountNumber(account.account_number);
    setInstructions(account.instructions || "Use your Order Number as payment reference.");
    setIsActive(account.is_active);
    setFormError("");
    setModalOpen(true);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setActionSuccess("");
    try {
      const res = await fetch("/api/admin/bank-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setBanks((prev) =>
          prev.map((b) => (b.id === id ? { ...b, is_active: !currentStatus } : b))
        );
        setActionSuccess(`Bank account ${!currentStatus ? "ACTIVATED" : "DISABLED"} successfully.`);
        setTimeout(() => setActionSuccess(""), 3500);
      } else {
        alert(resJson?.error || "Failed to toggle status");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update account status");
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm("Are you sure you want to remove or deactivate this settlement account?")) return;
    try {
      const res = await fetch(`/api/admin/bank-accounts?id=${id}`, {
        method: "DELETE",
      });
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        fetchBanks();
        setActionSuccess(resJson.message || "Account removed successfully.");
        setTimeout(() => setActionSuccess(""), 3500);
      } else {
        alert(resJson?.error || "Failed to delete bank account");
      }
    } catch (err: any) {
      alert(err?.message || "Error deleting bank account");
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      if (editingAccount) {
        // UPDATE (PATCH)
        const res = await fetch("/api/admin/bank-accounts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingAccount.id,
            bank_name: bankName.trim(),
            account_name: accountName.trim(),
            account_number: accountNumber.trim(),
            instructions: instructions.trim(),
            is_active: isActive,
          }),
        });
        const resJson = await res.json();
        if (res.ok && resJson?.success) {
          setModalOpen(false);
          fetchBanks();
          setActionSuccess("Bank account updated successfully.");
          setTimeout(() => setActionSuccess(""), 3500);
        } else {
          setFormError(resJson?.error || "Failed to update account");
        }
      } else {
        // CREATE (POST)
        const res = await fetch("/api/admin/bank-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bank_name: bankName.trim(),
            account_name: accountName.trim(),
            account_number: accountNumber.trim(),
            instructions: instructions.trim(),
            is_active: isActive,
          }),
        });
        const resJson = await res.json();
        if (res.ok && resJson?.success) {
          setModalOpen(false);
          fetchBanks();
          setActionSuccess("New settlement bank account added successfully.");
          setTimeout(() => setActionSuccess(""), 3500);
        } else {
          setFormError(resJson?.error || "Failed to create account");
        }
      }
    } catch (err: any) {
      setFormError(err?.message || "Error processing account submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Financial Settlement Gateway
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            Settlement Bank Accounts
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage Ethiopian banking institutions, CBE, Telebirr, and private accounts. Only active accounts appear at customer checkout.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-[#E0B382] hover:text-white text-xs font-bold px-5 py-2.5 rounded-2xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Bank Account</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-400 text-xs">
            <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading settlement bank accounts...
          </div>
        ) : banks.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-stone-200 p-8">
            <CreditCard size={36} className="mx-auto text-stone-300 mb-2" />
            <h3 className="font-bold text-stone-800 text-base mb-1">No settlement accounts configured</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
              Add your official corporate bank accounts (e.g. Commercial Bank of Ethiopia, Awash, Telebirr) to accept customer payments.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-[#1E3B2E] text-[#E0B382] text-xs font-bold cursor-pointer"
            >
              Add First Account
            </button>
          </div>
        ) : (
          banks.map((b) => (
            <div
              key={b.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                b.is_active
                  ? "bg-white border-stone-200/90 shadow-sm hover:shadow-md"
                  : "bg-stone-100/70 border-dashed border-stone-300 opacity-70"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-[#1E3B2E]/10 border border-[#1E3B2E]/20 text-[#1E3B2E] flex items-center justify-center">
                      <Building2 size={18} />
                    </div>
                    <span className="font-serif font-bold text-base text-stone-900">{b.bank_name}</span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      b.is_active
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-stone-200 text-stone-600 border border-stone-300"
                    }`}
                  >
                    {b.is_active ? "Active" : "Disabled"}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-xs">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block">
                      Account Name
                    </span>
                    <span className="font-semibold text-stone-800">{b.account_name}</span>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block">
                      Account Number
                    </span>
                    <span className="font-mono text-sm font-bold text-[#1E3B2E] tracking-wider select-all break-all">
                      {b.account_number}
                    </span>
                  </div>

                  {b.instructions && (
                    <div className="pt-2 border-t border-stone-100">
                      <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">
                        Transfer Remark Instructions
                      </span>
                      <p className="text-stone-600 text-[11px] bg-stone-50 p-2.5 rounded-xl border border-stone-100 leading-relaxed">
                        {b.instructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleStatus(b.id, b.is_active)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    b.is_active
                      ? "bg-stone-100 hover:bg-stone-200 text-stone-700"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                  }`}
                >
                  <Power size={13} />
                  <span>{b.is_active ? "Disable" : "Enable"}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
                    title="Edit Account Details"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    onClick={() => handleDeleteBank(b.id)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                    title="Remove Account"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-8 shadow-2xl border border-stone-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1E3B2E]/10 flex items-center justify-center text-[#1E3B2E]">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    {editingAccount ? "Edit Settlement Account" : "Add Settlement Bank"}
                  </h3>
                  <p className="text-[11px] text-stone-500">Configure bank credentials for customer payment checkout</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccount} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Bank / Provider Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Bank of Ethiopia (CBE) or Telebirr"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ethiopia Arenguade Paper Product PLC"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Account Number / PayBill Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1000123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-mono font-bold focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Payer Instructions / Remark Guide
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please put Order Number in transfer remark and upload receipt screenshot."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="accountActiveCheckbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E] border-stone-300 cursor-pointer"
                />
                <label htmlFor="accountActiveCheckbox" className="text-xs font-medium text-stone-700 cursor-pointer">
                  Activate account immediately for customer checkout
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1E3B2E] text-[#E0B382] hover:bg-[#8C4B31] hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : editingAccount ? "Update Account" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

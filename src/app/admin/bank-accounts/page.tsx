"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Building2, 
  Smartphone,
  X,
  AlertCircle,
  Check
} from "lucide-react";

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  instructions: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminBankAccountsPage() {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  
  // New bank form state
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("Ethiopia Arenguade Paper Product PLC");
  const [accountNumber, setAccountNumber] = useState("");
  const [instructions, setInstructions] = useState("Use your Order Number as payment reference.");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setActionSuccess(`Bank status ${!currentStatus ? "ACTIVATED" : "DISABLED"} successfully.`);
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

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber,
          instructions,
          is_active: true,
        }),
      });
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setModalOpen(false);
        setBankName("");
        setAccountNumber("");
        fetchBanks();
        setActionSuccess("Settlement bank account created successfully.");
        setTimeout(() => setActionSuccess(""), 3500);
      } else {
        alert(resJson?.error || "Failed to create account");
      }
    } catch (err: any) {
      alert(err?.message || "Error creating bank account");
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
            Manage official Ethiopian banking channels and Telebirr merchant accounts. Only active accounts appear at checkout.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Bank Account</span>
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

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-400 text-xs">
            <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading settlement bank accounts...
          </div>
        ) : banks.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-400 text-xs">
            <CreditCard size={32} className="mx-auto text-stone-300 mb-2" />
            No settlement bank accounts configured.
          </div>
        ) : (
          banks.map((b) => (
            <div
              key={b.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                b.is_active
                  ? "bg-white border-stone-200 shadow-sm"
                  : "bg-stone-50/70 border-dashed border-stone-300 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${
                    b.bank_name.toLowerCase().includes("telebirr")
                      ? "bg-amber-100 text-amber-900"
                      : "bg-[#1E3B2E]/10 text-[#1E3B2E]"
                  }`}>
                    {b.bank_name.toLowerCase().includes("telebirr") ? (
                      <Smartphone size={22} />
                    ) : (
                      <Building2 size={22} />
                    )}
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    b.is_active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                  }`}>
                    {b.is_active ? "Active at Checkout" : "Disabled"}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                  {b.bank_name}
                </h3>
                <p className="text-xs text-stone-500 font-medium mt-1">
                  {b.account_name}
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200/60 font-mono text-sm font-bold text-stone-900 tracking-wider">
                  {b.account_number}
                </div>

                {b.instructions && (
                  <p className="text-[11px] text-stone-500 mt-3 italic leading-relaxed">
                    &ldquo;{b.instructions}&rdquo;
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => toggleStatus(b.id, b.is_active)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                    b.is_active
                      ? "bg-stone-100 hover:bg-stone-200 text-stone-700"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {b.is_active ? "Disable" : "Enable"}
                </button>

                <button
                  onClick={() => handleDeleteBank(b.id)}
                  className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove account"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Bank Account Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:bg-stone-100 text-stone-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-[#1E3B2E]/10 text-[#1E3B2E]">
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Add Settlement Account</h3>
                <p className="text-[11px] text-stone-500">Configure bank or Telebirr account for customer checkout</p>
              </div>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Bank / Channel Name
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Commercial Bank of Ethiopia (CBE), Telebirr..."
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Arenguade Paper Products PLC"
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Account / Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1000... or +251 9..."
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Payment Instructions for Customer
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Put your Order Number in the deposit/transfer remark."
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Add Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

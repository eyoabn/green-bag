"use client";

import { useState } from "react";
import { 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  Building2, 
  Smartphone,
  X
} from "lucide-react";

interface BankConfig {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  type: "bank" | "mobile_money";
  isActive: boolean;
}

const INITIAL_BANKS: BankConfig[] = [
  {
    id: "1",
    bankName: "Commercial Bank of Ethiopia (CBE)",
    accountName: "Ethiopia Arenguade Paper Product PLC",
    accountNumber: "1000123456789",
    type: "bank",
    isActive: true
  },
  {
    id: "2",
    bankName: "Telebirr SuperApp Merchant",
    accountName: "Arenguade Eco Craft PLC",
    accountNumber: "0911234567",
    type: "mobile_money",
    isActive: true
  },
  {
    id: "3",
    bankName: "Awash Bank",
    accountName: "Ethiopia Arenguade Paper Product",
    accountNumber: "01320876543200",
    type: "bank",
    isActive: true
  },
  {
    id: "4",
    bankName: "Dashen Bank (Amole)",
    accountName: "Arenguade Paper Product",
    accountNumber: "510294819001",
    type: "bank",
    isActive: false
  }
];

export default function AdminBankAccountsPage() {
  const [banks, setBanks] = useState<BankConfig[]>(INITIAL_BANKS);
  const [modalOpen, setModalOpen] = useState(false);
  
  // New bank state
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("Ethiopia Arenguade Paper Product PLC");
  const [accountNumber, setAccountNumber] = useState("");
  const [type, setType] = useState<"bank" | "mobile_money">("bank");

  const toggleStatus = (id: string) => {
    setBanks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const newBank: BankConfig = {
      id: String(banks.length + 1),
      bankName,
      accountName,
      accountNumber,
      type,
      isActive: true
    };
    setBanks([...banks, newBank]);
    setModalOpen(false);
    setBankName("");
    setAccountNumber("");
  };

  return (
    <div className="flex flex-col max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Financial Settlement Channels
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Official Ethiopian Bank Accounts
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage the bank accounts and mobile money till numbers displayed to customers and students at checkout.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-3 rounded-full transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          <span>Add Settlement Account</span>
        </button>
      </div>

      {/* Banking Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banks.map((bank) => (
          <div
            key={bank.id}
            className={`p-6 sm:p-8 rounded-3xl border transition-all ${
              bank.isActive
                ? "bg-white border-stone-300/80 shadow-sm"
                : "bg-stone-100/70 border-stone-200 opacity-60"
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bank.type === "mobile_money" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-700"}`}>
                  {bank.type === "mobile_money" ? <Smartphone size={24} /> : <Building2 size={24} />}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    {bank.bankName}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {bank.type === "mobile_money" ? "Mobile Money Till / Merchant" : "Commercial Bank Account"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleStatus(bank.id)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                  bank.isActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-stone-200 text-stone-600"
                }`}
              >
                {bank.isActive ? "Active at Checkout" : "Disabled"}
              </button>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-1.5 mb-6 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Account Number:</span>
                <span className="font-mono font-bold text-stone-900 text-sm tracking-wider">
                  {bank.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Beneficiary Name:</span>
                <span className="font-medium text-stone-800">{bank.accountName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-stone-400 text-[11px]">
                {bank.isActive ? "Displayed to all customers during bank transfer flow" : "Hidden from checkout options"}
              </span>
              <button
                onClick={() => toggleStatus(bank.id)}
                className="font-bold text-[#8C4B31] hover:underline"
              >
                {bank.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Bank Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-800"
            >
              <X size={20} />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">
              Settlement Gateway
            </span>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1 mb-4">
              Add Bank Account
            </h3>

            <form onSubmit={handleAddAccount} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Financial Institution</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank of Abyssinia"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Account / Merchant Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1000987654321"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Payment Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                >
                  <option value="bank">Commercial Bank Transfer</option>
                  <option value="mobile_money">Mobile Money / SuperApp Till</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold tracking-wider uppercase transition-all shadow-md"
                >
                  Enable Account at Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

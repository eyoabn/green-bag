"use client";

import { createClient } from "@/utils/supabase/client";

export interface StoredOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productId: string;
  productName: string;
  quantityBundles: number;
  totalEtb: number;
  bankName: string;
  status: "pending_verification" | "approved" | "rejected" | "fulfilled";
  timestamp: string;
  receiptUrl?: string;
  receiptDetails?: {
    transactionId: string;
    payerAccount: string;
    date: string;
    amount: string;
  };
}

export interface StoredBankAccount {
  id: string;
  name: string;
  accountNumber: string;
  accountHolder?: string;
  accountName?: string;
  type: "bank" | "mobile_money";
  isActive: boolean;
}

export interface StoredRegistration {
  id: string;
  sessionId: string;
  sessionTitle: string;
  sessionType: "in_person" | "live";
  sessionDate: string;
  sessionTime: string;
  location: string;
  studentName: string;
  studentPhone: string;
  priceEtb: number;
  status: "pending_verification" | "approved" | "rejected";
  timestamp: string;
  receiptUrl?: string;
}

export interface StoredDesign {
  id: string;
  clientName: string;
  clientCompany: string;
  clientContact: string;
  dimensions: string;
  paperWeight: string;
  paperShade: string;
  quantity: number;
  handleType: string;
  status: "new" | "reviewing" | "proof_ready" | "approved";
  submittedDate: string;
  fileName: string;
  notes: string;
}

// Initial Default Bank Accounts
export const DEFAULT_BANKS: StoredBankAccount[] = [
  {
    id: "cbe",
    name: "Commercial Bank of Ethiopia (CBE)",
    accountNumber: "1000123456789",
    accountHolder: "Ethiopia Arenguade Paper Product PLC",
    type: "bank",
    isActive: true,
  },
  {
    id: "telebirr",
    name: "Telebirr SuperApp Merchant",
    accountNumber: "0911234567",
    accountHolder: "Arenguade Eco Craft PLC",
    type: "mobile_money",
    isActive: true,
  },
  {
    id: "awash",
    name: "Awash Bank",
    accountNumber: "01320876543200",
    accountHolder: "Ethiopia Arenguade Paper Product",
    type: "bank",
    isActive: true,
  },
  {
    id: "dashen",
    name: "Dashen Bank (Amole)",
    accountNumber: "510294819001",
    accountHolder: "Arenguade Paper Product",
    type: "bank",
    isActive: false,
  }
];

// Initial Demo Orders
export const DEFAULT_ORDERS: StoredOrder[] = [
  {
    id: "ARN-2026-8491",
    customerName: "Dawit Haile",
    customerPhone: "0911234567",
    customerEmail: "dawit@oromiacoffee.et",
    productId: "1",
    productName: "Specialty Coffee Degassing Pouch (500 Bags)",
    quantityBundles: 5,
    totalEtb: 855,
    bankName: "Commercial Bank of Ethiopia (CBE)",
    status: "pending_verification",
    timestamp: "10 mins ago",
    receiptDetails: {
      transactionId: "CBE-TXN-99882314",
      payerAccount: "1000234891024",
      date: "04/09/2026 14:32",
      amount: "855.00 ETB",
    }
  },
  {
    id: "ARN-2026-7732",
    customerName: "Bethlehem Mengistu",
    customerPhone: "0922456789",
    customerEmail: "bethlehem@bolecouture.com",
    productId: "2",
    productName: "Bole Boutique Luxury Shopper (1,000 Bags)",
    quantityBundles: 10,
    totalEtb: 2112,
    bankName: "Telebirr SuperApp Merchant",
    status: "approved",
    timestamp: "2 hours ago",
    receiptDetails: {
      transactionId: "TB-8834910294",
      payerAccount: "0922456789",
      date: "04/09/2026 12:15",
      amount: "2,112.00 ETB",
    }
  },
  {
    id: "ARN-2026-6120",
    customerName: "Yonas Birhanu",
    customerPhone: "0933789012",
    customerEmail: "yonas@addisbakery.et",
    productId: "5",
    productName: "Addis Artisan Bakery Pouch (300 Bags)",
    quantityBundles: 3,
    totalEtb: 330,
    bankName: "Awash Bank",
    status: "pending_verification",
    timestamp: "3 hours ago",
    receiptDetails: {
      transactionId: "AW-REF-7749102",
      payerAccount: "013209847190",
      date: "04/09/2026 11:04",
      amount: "330.00 ETB",
    }
  }
];

// Initial Demo Workshop Registrations
export const DEFAULT_REGISTRATIONS: StoredRegistration[] = [
  {
    id: "REG-2026-102",
    sessionId: "2",
    sessionTitle: "Virtual: Advanced Origami Folds & Gusset Dynamics",
    sessionType: "live",
    sessionDate: "Oct 18, 2026",
    sessionTime: "3:00 PM - 5:00 PM",
    location: "LiveKit Interactive Video Room",
    studentName: "Dawit Haile",
    studentPhone: "0911234567",
    priceEtb: 300,
    status: "approved",
    timestamp: "Yesterday",
  },
  {
    id: "REG-2026-098",
    sessionId: "1",
    sessionTitle: "Beginner Paper Bag Workshop & Structural Folds",
    sessionType: "in_person",
    sessionDate: "Oct 15, 2026",
    sessionTime: "10:00 AM - 2:00 PM",
    location: "Addis Ababa Studio (Bole Subcity)",
    studentName: "Dawit Haile",
    studentPhone: "0911234567",
    priceEtb: 500,
    status: "pending_verification",
    timestamp: "2 days ago",
  }
];

// Storage Keys
const ORDERS_KEY = "arenguade_orders";
const BANKS_KEY = "arenguade_banks";
const REGISTRATIONS_KEY = "arenguade_registrations";
const DESIGNS_KEY = "arenguade_designs";

// Helper for localStorage safely in Next.js SSR
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("arenguade_datastore_change"));
  } catch (err) {
    console.error("Failed to save to localStorage", err);
  }
}

export const DataStore = {
  // --- ORDERS ---
  getOrders(): StoredOrder[] {
    return getLocal<StoredOrder[]>(ORDERS_KEY, DEFAULT_ORDERS);
  },

  async addOrder(orderData: Omit<StoredOrder, "id" | "timestamp" | "status">): Promise<StoredOrder> {
    const newId = `ARN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: StoredOrder = {
      ...orderData,
      id: newId,
      status: "pending_verification",
      timestamp: "Just now",
      receiptDetails: {
        transactionId: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
        payerAccount: orderData.customerPhone,
        date: new Date().toLocaleDateString("en-GB") + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        amount: `${orderData.totalEtb}.00 ETB`,
      }
    };

    const current = this.getOrders();
    setLocal(ORDERS_KEY, [newOrder, ...current]);

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        await supabase.from("orders").insert({
          id: newId,
          total_price: orderData.totalEtb,
          quantity: orderData.quantityBundles,
          status: "pending_verification",
        });
      }
    } catch (e) {
      console.warn("Supabase order insert skipped/failed:", e);
    }

    return newOrder;
  },

  updateOrderStatus(orderId: string, status: StoredOrder["status"]): void {
    const current = this.getOrders();
    const updated = current.map((o) => (o.id === orderId ? { ...o, status } : o));
    setLocal(ORDERS_KEY, updated);
  },

  // --- BANK ACCOUNTS ---
  getBanks(): StoredBankAccount[] {
    return getLocal<StoredBankAccount[]>(BANKS_KEY, DEFAULT_BANKS);
  },

  getActiveBanks(): StoredBankAccount[] {
    const banks = this.getBanks();
    return banks.filter((b) => b.isActive);
  },

  addBank(bank: Omit<StoredBankAccount, "id">): StoredBankAccount {
    const banks = this.getBanks();
    const holder = bank.accountHolder || bank.accountName || "Ethiopia Arenguade Paper Product PLC";
    const newBank: StoredBankAccount = {
      ...bank,
      accountHolder: holder,
      accountName: holder,
      id: `bank_${Date.now()}`,
    };
    setLocal(BANKS_KEY, [...banks, newBank]);
    return newBank;
  },

  toggleBankStatus(bankId: string): void {
    const banks = this.getBanks();
    const updated = banks.map((b) => (b.id === bankId ? { ...b, isActive: !b.isActive } : b));
    setLocal(BANKS_KEY, updated);
  },

  // --- REGISTRATIONS ---
  getRegistrations(): StoredRegistration[] {
    return getLocal<StoredRegistration[]>(REGISTRATIONS_KEY, DEFAULT_REGISTRATIONS);
  },

  addRegistration(reg: Omit<StoredRegistration, "id" | "timestamp" | "status">): StoredRegistration {
    const current = this.getRegistrations();
    const newReg: StoredRegistration = {
      ...reg,
      id: `REG-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: "pending_verification",
      timestamp: "Just now",
    };
    setLocal(REGISTRATIONS_KEY, [newReg, ...current]);
    return newReg;
  },

  // --- DESIGNS ---
  getDesigns(): StoredDesign[] {
    return getLocal<StoredDesign[]>(DESIGNS_KEY, []);
  },

  addDesign(design: Omit<StoredDesign, "id" | "submittedDate" | "status">): StoredDesign {
    const current = this.getDesigns();
    const newDesign: StoredDesign = {
      ...design,
      id: `DSG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "new",
      submittedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    };
    setLocal(DESIGNS_KEY, [newDesign, ...current]);
    return newDesign;
  }
};

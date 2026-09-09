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

export interface StoredProduct {
  id: string;
  name: string;
  client?: string;
  category: string;
  price: number;
  bundleSize: number;
  gsm: number;
  handleType: string;
  image: string;
  gallery: string[];
  badge?: string;
  description: string;
  dimensions: string;
  material: string;
  inStock: boolean;
}

export interface StoredClassSession {
  id: string;
  type: "in_person" | "live";
  title: string;
  instructor: string;
  date: string;
  time: string;
  location: string;
  price: number;
  capacity: number;
  enrolled: number;
  livekitRoom?: string;
  description?: string;
  materialsIncluded?: string[];
}

export type StoredClass = StoredClassSession;

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

// Initial Real Orders (Starts empty - only real customer submissions)
export const DEFAULT_ORDERS: StoredOrder[] = [];

// Initial Real Workshop Registrations (Starts empty - only real student enrollments)
export const DEFAULT_REGISTRATIONS: StoredRegistration[] = [];

export const DEFAULT_PRODUCTS: StoredProduct[] = [
  {
    id: "1",
    name: "Rare Specialty Coffee Roasters Bag",
    client: "Rare Coffee Roastery",
    category: "Coffee & Food",
    price: 180,
    bundleSize: 100,
    gsm: 220,
    handleType: "Twisted Black Cord",
    image: "/images/photo_6_2026-09-05_00-36-03.jpg",
    gallery: ["/images/photo_6_2026-09-05_00-36-03.jpg", "/images/photo_13_2026-09-05_00-36-03.jpg"],
    badge: "Coffee Roasters Choice",
    description: "Signature unbleached kraft carrier bag crafted for Ethiopian specialty coffee roasters.",
    dimensions: "24cm × 28cm + 10cm gusset",
    material: "100% Ethiopian Virgin Kraft",
    inStock: true
  },
  {
    id: "2",
    name: "Richo's Luxury Boutique Tote with Tibeb Border",
    client: "Richo's Boutique",
    category: "Luxury Retail",
    price: 260,
    bundleSize: 100,
    gsm: 250,
    handleType: "Woven Cotton Rope",
    image: "/images/photo_3_2026-09-05_00-36-02.jpg",
    gallery: ["/images/photo_3_2026-09-05_00-36-02.jpg", "/images/photo_4_2026-09-05_00-36-02.jpg"],
    badge: "Bestseller",
    description: "Premium white coated luxury retail bag featuring traditional Ethiopian Tibeb pattern border.",
    dimensions: "32cm × 36cm + 12cm gusset",
    material: "250 GSM Bleached Matte Kraft",
    inStock: true
  },
  {
    id: "3",
    name: "Hassan Adama Luxury Fashion Shopper",
    client: "Hassan Adama",
    category: "Luxury Retail",
    price: 250,
    bundleSize: 100,
    gsm: 240,
    handleType: "Braided Black Cord",
    image: "/images/photo_4_2026-09-05_00-36-02.jpg",
    gallery: ["/images/photo_4_2026-09-05_00-36-02.jpg"],
    badge: "VIP Boutique",
    description: "Clean, elegant typography with custom monogram emblem for suits, dresses, and footwear.",
    dimensions: "30cm × 34cm + 12cm gusset",
    material: "240 GSM Coated White Kraft",
    inStock: true
  },
  {
    id: "4",
    name: "Liora Fashion Store Carrier",
    client: "Liora Fashion",
    category: "Standard Retail",
    price: 160,
    bundleSize: 100,
    gsm: 180,
    handleType: "Twisted Black Cord",
    image: "/images/photo_13_2026-09-05_00-36-03.jpg",
    gallery: ["/images/photo_13_2026-09-05_00-36-03.jpg"],
    badge: "High Durability",
    description: "Natural earth brown kraft bag printed with clean modern branding and social tags.",
    dimensions: "22cm × 28cm + 10cm gusset",
    material: "180 GSM Recycled Earth Kraft",
    inStock: true
  }
];

export const DEFAULT_CLASSES: StoredClassSession[] = [
  {
    id: "1",
    type: "in_person",
    title: "Beginner Paper Bag Workshop & Structural Folds",
    instructor: "Master Craftsman Abebe Kebede",
    date: "Oct 15, 2026",
    time: "10:00 AM - 2:00 PM",
    location: "Addis Ababa Studio (Bole Subcity)",
    price: 500,
    capacity: 12,
    enrolled: 8,
    description: "Learn paper selection, precise bone-folder creasing, gusset calculations, and manual handle installation with heavy kraft paper.",
    materialsIncluded: ["100% Ethiopian Virgin Kraft sheets", "Adhesives & bone folders", "Twisted cords & eyelets", "Take-home portfolio"]
  },
  {
    id: "2",
    type: "live",
    title: "Virtual: Advanced Origami Folds & Gusset Dynamics",
    instructor: "Sara Haile (Design Lead)",
    date: "Oct 18, 2026",
    time: "3:00 PM - 5:00 PM",
    location: "LiveKit Online Classroom",
    price: 300,
    capacity: 40,
    enrolled: 26,
    livekitRoom: "session_2",
    description: "Real-time LiveKit WebRTC interactive session covering multi-layered gusset geometries and load-bearing bottom reinforcement.",
    materialsIncluded: ["Downloadable CAD cutting die outlines", "Live video replay access", "Digital Certificate of Completion"]
  },
  {
    id: "3",
    type: "in_person",
    title: "Corporate Gift Bag & Screen Printing Masterclass",
    instructor: "Abebe Kebede & Technical Team",
    date: "Oct 22, 2026",
    time: "9:00 AM - 4:00 PM",
    location: "Addis Ababa Studio (Bole Subcity)",
    price: 1000,
    capacity: 10,
    enrolled: 7,
    description: "Full-day intensive covering high-speed manual creasing, spot UV varnish basics, gold foil stamping, and commercial pricing.",
    materialsIncluded: ["Commercial-grade 250 GSM kraft boards", "Screen printing inks & squeegees", "Lunch & refreshments", "Arenguade Academy Certificate"]
  }
];

// Storage Keys
const ORDERS_KEY = "arenguade_orders";
const BANKS_KEY = "arenguade_banks";
const REGISTRATIONS_KEY = "arenguade_registrations";
const DESIGNS_KEY = "arenguade_designs";
const PRODUCTS_KEY = "arenguade_products";
const CLASSES_KEY = "arenguade_classes";

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
  // --- PRODUCTS ---
  getProducts(): StoredProduct[] {
    return getLocal<StoredProduct[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
  },

  getProductById(id: string): StoredProduct | undefined {
    const products = this.getProducts();
    return products.find((p) => p.id === id);
  },

  async addProduct(product: Omit<StoredProduct, "id">): Promise<StoredProduct> {
    const products = this.getProducts();
    const newProduct: StoredProduct = {
      ...product,
      id: `prod_${Date.now()}`,
    };
    setLocal(PRODUCTS_KEY, [newProduct, ...products]);

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        await supabase.from("products").insert({
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          image_urls: newProduct.gallery.length > 0 ? newProduct.gallery : [newProduct.image],
          is_available: newProduct.inStock,
        });
      }
    } catch (e) {
      console.warn("Supabase product sync failed:", e);
    }

    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<StoredProduct>): Promise<void> {
    const products = this.getProducts();
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setLocal(PRODUCTS_KEY, updated);

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        await supabase.from("products").update({
          name: updates.name,
          price: updates.price,
          description: updates.description,
          is_available: updates.inStock,
        }).eq("id", id);
      }
    } catch (e) {
      console.warn("Supabase product update failed:", e);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const products = this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    setLocal(PRODUCTS_KEY, filtered);

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        await supabase.from("products").delete().eq("id", id);
      }
    } catch (e) {
      console.warn("Supabase product delete failed:", e);
    }
  },

  toggleProductStock(id: string): void {
    const products = this.getProducts();
    const updated = products.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p));
    setLocal(PRODUCTS_KEY, updated);
  },

  // --- CLASSES & WORKSHOPS ---
  getClasses(): StoredClassSession[] {
    return getLocal<StoredClassSession[]>(CLASSES_KEY, DEFAULT_CLASSES);
  },

  async addClass(session: Omit<StoredClassSession, "id" | "enrolled">): Promise<StoredClassSession> {
    const classes = this.getClasses();
    const newClass: StoredClassSession = {
      ...session,
      id: `cls_${Date.now()}`,
      enrolled: 0,
    };
    setLocal(CLASSES_KEY, [...classes, newClass]);

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        await supabase.from("class_sessions").insert({
          type: newClass.type,
          title: newClass.title,
          description: newClass.description || "",
          teacher_name: newClass.instructor,
          location: newClass.location,
          livekit_room_name: newClass.livekitRoom || `session_${newClass.id}`,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 7200000).toISOString(),
          capacity: newClass.capacity,
          price: newClass.price,
        });
      }
    } catch (e) {
      console.warn("Supabase class session sync failed:", e);
    }

    return newClass;
  },

  async deleteClass(id: string): Promise<void> {
    const classes = this.getClasses();
    setLocal(CLASSES_KEY, classes.filter((c) => c.id !== id));

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        await supabase.from("class_sessions").delete().eq("id", id);
      }
    } catch (e) {
      console.warn("Supabase class delete failed:", e);
    }
  },

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

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        supabase.from("orders").update({ status }).eq("id", orderId).then();
      }
    } catch (e) {
      console.warn("Supabase order status update failed:", e);
    }
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

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        supabase.from("bank_accounts").insert({
          bank_name: newBank.name,
          account_name: holder,
          account_number: newBank.accountNumber,
          is_active: newBank.isActive,
        }).then();
      }
    } catch (e) {
      console.warn("Supabase bank account insert failed:", e);
    }

    return newBank;
  },

  deleteBank(bankId: string): void {
    const banks = this.getBanks();
    setLocal(BANKS_KEY, banks.filter((b) => b.id !== bankId));

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        supabase.from("bank_accounts").delete().eq("id", bankId).then();
      }
    } catch (e) {
      console.warn("Supabase bank delete failed:", e);
    }
  },

  toggleBankStatus(bankId: string): void {
    const banks = this.getBanks();
    const updated = banks.map((b) => (b.id === bankId ? { ...b, isActive: !b.isActive } : b));
    setLocal(BANKS_KEY, updated);

    try {
      const target = updated.find((b) => b.id === bankId);
      if (target) {
        const supabase = createClient();
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
          supabase.from("bank_accounts").update({ is_active: target.isActive }).eq("account_number", target.accountNumber).then();
        }
      }
    } catch (e) {
      console.warn("Supabase bank toggle failed:", e);
    }
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

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        supabase.from("session_registrations").insert({
          session_id: reg.sessionId,
          payment_screenshot_url: reg.receiptUrl || "uploaded_qr_slip",
          status: "pending_verification",
        }).then();
      }
    } catch (e) {
      console.warn("Supabase registration insert skipped:", e);
    }

    return newReg;
  },

  updateRegistrationStatus(regId: string, status: StoredRegistration["status"]): void {
    const current = this.getRegistrations();
    const updated = current.map((r) => (r.id === regId ? { ...r, status } : r));
    setLocal(REGISTRATIONS_KEY, updated);

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        supabase.from("session_registrations").update({ status }).eq("id", regId).then();
      }
    } catch (e) {
      console.warn("Supabase registration update failed:", e);
    }
  },

  getRegistrationsBySessionId(sessionId: string): StoredRegistration[] {
    return this.getRegistrations().filter((r) => r.sessionId === sessionId);
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

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        supabase.from("designs").insert({
          file_url: newDesign.fileName,
          note: `${newDesign.clientCompany} - ${newDesign.dimensions} - ${newDesign.notes}`,
          status: "new",
        }).then();
      }
    } catch (e) {
      console.warn("Supabase design insert failed:", e);
    }

    return newDesign;
  },

  updateDesignStatus(id: string, status: StoredDesign["status"]): void {
    const current = this.getDesigns();
    const updated = current.map((d) => (d.id === id ? { ...d, status } : d));
    setLocal(DESIGNS_KEY, updated);

    try {
      const supabase = createClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        supabase.from("designs").update({ status }).eq("id", id).then();
      }
    } catch (e) {
      console.warn("Supabase design update failed:", e);
    }
  }
};


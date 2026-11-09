import { pool } from "@/utils/db";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import HomeClient from "@/components/HomeClient";

// Incremental Static Regeneration (ISR) - revalidates page periodically and instantly upon admin updates
export const revalidate = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://heslqxyonklerdcxjohf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlc2xxeHlvbmtsZXJkY3hqb2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODMyOTIsImV4cCI6MjEwNDU1OTI5Mn0.NaVbb5W4lZa82GjtFBjE3hur60p68v5r13OdOwp3iwE";

async function getInitialHomeData() {
  let products: any[] = [];
  let workshops: any[] = [];
  let settings: any = null;

  // 1. Direct PostgreSQL query via connection pool for instantaneous consistency
  try {
    const [prodDb, setDb, wsDb] = await Promise.allSettled([
      pool.query(`
        SELECT id, name, description, price, images, image_urls, category, stock_quantity, is_available, is_featured, is_client_work
        FROM public.products
        WHERE is_available = true AND is_deleted IS NOT TRUE
        ORDER BY is_featured DESC, created_at DESC
        LIMIT 6;
      `),
      pool.query(`
        SELECT id, company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days, homepage_content, updated_at
        FROM public.settings
        WHERE id = 'default' OR id = 'company'
        ORDER BY updated_at DESC
        LIMIT 1;
      `),
      pool.query(`
        SELECT id, title, type, price, starts_at, ends_at, capacity, location, status
        FROM public.class_sessions
        WHERE status = 'scheduled'
        ORDER BY starts_at ASC
        LIMIT 2;
      `),
    ]);

    if (prodDb.status === "fulfilled" && prodDb.value?.rows?.length > 0) {
      products = prodDb.value.rows.map((p: any) => {
        const imgList = (p.images && p.images.length > 0) ? p.images : (p.image_urls || []);
        return {
          ...p,
          price: Number(p.price),
          images: imgList.length > 0 ? imgList : ["/images/photo_6_2026-09-05_00-36-03.jpg"],
        };
      });
    }

    if (setDb.status === "fulfilled" && setDb.value?.rows?.[0]) {
      settings = setDb.value.rows[0];
    }

    if (wsDb.status === "fulfilled" && wsDb.value?.rows?.length > 0) {
      workshops = wsDb.value.rows.map((w: any) => ({
        ...w,
        price: Number(w.price),
      }));
    }

    // If pool succeeded in fetching products and settings, return directly
    if (products.length > 0 && settings) {
      return { products, workshops, settings };
    }
  } catch (poolErr) {
    console.warn("Direct pool query in page.tsx fallback to Supabase:", poolErr);
  }

  // 2. Resilient fallback to Supabase JS Client
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url, options = {}) =>
          fetch(url, { ...options, signal: controller.signal }),
      },
    });

    const [prodRes, wsRes, setRes] = await Promise.allSettled([
      supabase
        .from("products")
        .select("id, name, description, price, images, image_urls, category, stock_quantity, is_available, is_featured, is_client_work")
        .eq("is_available", true)
        .or("is_deleted.is.null,is_deleted.eq.false")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("class_sessions")
        .select("id, title, type, price, starts_at, ends_at, capacity, location, status")
        .eq("status", "scheduled")
        .order("starts_at", { ascending: true })
        .limit(2),
      supabase
        .from("settings")
        .select("*")
        .in("id", ["company", "default"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    clearTimeout(timer);

    if (prodRes.status === "fulfilled" && prodRes.value.data && products.length === 0) {
      products = prodRes.value.data.map((p: any) => {
        const imgList = (p.images && p.images.length > 0) ? p.images : (p.image_urls || []);
        return {
          ...p,
          price: Number(p.price),
          images: imgList.length > 0 ? imgList : ["/images/photo_6_2026-09-05_00-36-03.jpg"],
        };
      });
    }

    if (wsRes.status === "fulfilled" && wsRes.value.data && workshops.length === 0) {
      workshops = wsRes.value.data.map((w: any) => ({
        ...w,
        price: Number(w.price),
      }));
    }

    if (setRes.status === "fulfilled" && setRes.value.data && !settings) {
      settings = setRes.value.data;
    }
  } catch (err) {
    console.warn("Failed to prefetch homepage data:", err);
  }

  return { products, workshops, settings };
}

export default async function HomePage() {
  const { products, workshops, settings } = await getInitialHomeData();

  return (
    <HomeClient
      initialProducts={products}
      initialWorkshops={workshops}
      initialSettings={settings}
    />
  );
}

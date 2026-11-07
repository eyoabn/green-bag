import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import HomeClient from "@/components/HomeClient";

// Incremental Static Regeneration (ISR) - revalidates page every 5 minutes (300s)
export const revalidate = 300;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://heslqxyonklerdcxjohf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlc2xxeHlvbmtsZXJkY3hqb2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODMyOTIsImV4cCI6MjEwNDU1OTI5Mn0.NaVbb5W4lZa82GjtFBjE3hur60p68v5r13OdOwp3iwE";

async function getInitialHomeData() {
  let products: any[] = [];
  let workshops: any[] = [];
  let settings: any = null;

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
        .neq("is_deleted", true)
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
        .eq("id", "company")
        .maybeSingle(),
    ]);

    clearTimeout(timer);

    if (prodRes.status === "fulfilled" && prodRes.value.data) {
      products = prodRes.value.data.map((p: any) => {
        const imgList = (p.images && p.images.length > 0) ? p.images : (p.image_urls || []);
        return {
          ...p,
          price: Number(p.price),
          images: imgList.length > 0 ? imgList : ["/images/photo_6_2026-09-05_00-36-03.jpg"],
        };
      });
    }

    if (wsRes.status === "fulfilled" && wsRes.value.data) {
      workshops = wsRes.value.data.map((w: any) => ({
        ...w,
        price: Number(w.price),
      }));
    }

    if (setRes.status === "fulfilled" && setRes.value.data) {
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

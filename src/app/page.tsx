import { pool } from "@/utils/db";
import HomeClient from "@/components/HomeClient";

// Incremental Static Regeneration (ISR) - revalidates page every 5 minutes (300s)
export const revalidate = 300;

async function getInitialHomeData() {
  let products: any[] = [];
  let workshops: any[] = [];
  let settings: any = null;

  try {
    const prodRes = await pool.query(`
      SELECT id, name, description, price, images, image_urls, category, stock_quantity, is_available, is_featured, is_client_work
      FROM public.products
      WHERE is_deleted IS NOT TRUE AND is_available = true
      ORDER BY is_featured DESC, created_at DESC
      LIMIT 6;
    `);

    products = (prodRes.rows || []).map((p: any) => {
      const imgList = (p.images && p.images.length > 0) ? p.images : (p.image_urls || []);
      return {
        ...p,
        price: Number(p.price),
        images: imgList.length > 0 ? imgList : ["/images/photo_6_2026-09-05_00-36-03.jpg"],
      };
    });
  } catch (err) {
    console.warn("Failed to prefetch homepage products:", err);
  }

  try {
    const wsRes = await pool.query(`
      SELECT id, title, type, price, starts_at, ends_at, capacity, location, status
      FROM public.class_sessions
      WHERE status = 'scheduled'
      ORDER BY starts_at ASC
      LIMIT 2;
    `);

    workshops = (wsRes.rows || []).map((w: any) => ({
      ...w,
      price: Number(w.price),
    }));
  } catch (err) {
    console.warn("Failed to prefetch homepage workshops:", err);
  }

  try {
    const setRes = await pool.query(`SELECT * FROM public.settings WHERE id = 'company' LIMIT 1;`);
    settings = setRes.rows[0] || null;
  } catch (err) {
    console.warn("Failed to prefetch company settings:", err);
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

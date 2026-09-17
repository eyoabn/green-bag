const { Client } = require('pg');

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

const PRODUCTS_CATALOG = [
  {
    name: "Rare Specialty Coffee Roasters Bag",
    client: "Rare Coffee Roastery (Roasted in Ethiopia)",
    category: "Coffee & Food",
    price: 180,
    bundleSize: 100,
    gsm: 220,
    handleType: "Twisted Black Cord",
    image: "/images/photo_6_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_6_2026-09-05_00-36-03.jpg",
      "/images/photo_13_2026-09-05_00-36-03.jpg"
    ],
    badge: "Coffee Roasters Choice",
    description: "Signature unbleached kraft carrier bag crafted for Ethiopian specialty coffee roasters. Features custom typography, aroma seal capability, and high-tensile black twisted cord handles.",
    dimensions: "24cm × 28cm + 10cm gusset",
    material: "100% Ethiopian Virgin Kraft",
  },
  {
    name: "Richo's Luxury Boutique Tote with Tibeb Border",
    client: "Richo's Clothing Boutique",
    category: "Luxury Retail",
    price: 260,
    bundleSize: 100,
    gsm: 250,
    handleType: "Woven Cotton Rope",
    image: "/images/photo_3_2026-09-05_00-36-02.jpg",
    gallery: [
      "/images/photo_3_2026-09-05_00-36-02.jpg",
      "/images/photo_4_2026-09-05_00-36-02.jpg"
    ],
    badge: "Bestseller",
    description: "Premium white coated luxury retail bag featuring traditional Ethiopian Tibeb geometric pattern border, reinforced bottom card, and durable black braided rope handles for fashion boutiques.",
    dimensions: "32cm × 36cm + 12cm gusset",
    material: "250 GSM Bleached Matte Kraft",
  },
  {
    name: "Hassan Adama Luxury Fashion Shopper",
    client: "Hassan Adama Boutique",
    category: "Luxury Retail",
    price: 250,
    bundleSize: 100,
    gsm: 240,
    handleType: "Braided Black Cord",
    image: "/images/photo_4_2026-09-05_00-36-02.jpg",
    gallery: [
      "/images/photo_4_2026-09-05_00-36-02.jpg",
      "/images/photo_3_2026-09-05_00-36-02.jpg"
    ],
    badge: "VIP Boutique",
    description: "Clean, elegant typography with custom monogram emblem. Manufactured with rigid sidewalls and reinforced handle eyelets for suits, dresses, and footwear.",
    dimensions: "30cm × 34cm + 12cm gusset",
    material: "240 GSM Coated White Kraft",
  },
  {
    name: "Liora Fashion Store Carrier",
    client: "Liora Fashion Store",
    category: "Standard Retail",
    price: 160,
    bundleSize: 100,
    gsm: 180,
    handleType: "Twisted Black Cord",
    image: "/images/photo_13_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_13_2026-09-05_00-36-03.jpg",
      "/images/photo_6_2026-09-05_00-36-03.jpg"
    ],
    badge: "High Durability",
    description: "Natural earth brown kraft bag printed with clean modern branding and social tags. Perfect for everyday retail, cosmetics, and lifestyle brands.",
    dimensions: "22cm × 28cm + 10cm gusset",
    material: "180 GSM Recycled Earth Kraft",
  },
  {
    name: "Family Dental Clinic Medical Luxury Carrier",
    client: "Family Specialized Dental Clinic",
    category: "Healthcare & Corporate",
    price: 220,
    bundleSize: 100,
    gsm: 200,
    handleType: "Twisted Black Rope",
    image: "/images/photo_10_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_10_2026-09-05_00-36-03.jpg",
      "/images/photo_7_2026-09-05_00-36-03.jpg"
    ],
    badge: "Medical & Gift",
    description: "Crisp white clinic presentation bag with two-tone cyan and navy corporate print. Used for patient care kits, pharmaceutical giveaways, and executive gifts.",
    dimensions: "25cm × 25cm + 10cm gusset",
    material: "200 GSM Heavy Bleached Kraft",
  },
  {
    name: "Véro Tiramisù Artisan Sleeve Box",
    client: "Véro Tiramisù & Confectionery",
    category: "Confectionery & Bakery",
    price: 190,
    bundleSize: 50,
    gsm: 320,
    handleType: "Slide-Out Rigid Sleeve",
    image: "/images/photo_16_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_16_2026-09-05_00-36-03.jpg",
      "/images/photo_14_2026-09-05_00-36-03.jpg",
      "/images/photo_18_2026-09-05_00-36-03.jpg"
    ],
    badge: "Food Safe",
    description: "Food-grade specialty sleeve box designed for premium tiramisu and pastries. Features a rigid outer sleeve and a grease-resistant inner tray.",
    dimensions: "18cm × 12cm × 6cm",
    material: "320 GSM Food-Safe Kraft Board",
  },
  {
    name: "Eco-Friendly Recycled Grocery Sack",
    client: "Arenguade Standard Catalog",
    category: "Grocery & Market",
    price: 85,
    bundleSize: 200,
    gsm: 150,
    handleType: "Flat Paper Handle",
    image: "/images/photo_15_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_15_2026-09-05_00-36-03.jpg",
      "/images/photo_11_2026-09-05_00-36-03.jpg"
    ],
    badge: "Eco-Value",
    description: "Our most sustainable, unbranded brown grocery sack. Perfect for organic markets, zero-waste stores, and delivery services.",
    dimensions: "30cm × 40cm + 15cm gusset",
    material: "150 GSM 100% Recycled Post-Consumer Kraft",
  },
  {
    name: "Addis Corporate Executive Gift Bag",
    client: "Addis Corporate",
    category: "Healthcare & Corporate",
    price: 280,
    bundleSize: 100,
    gsm: 250,
    handleType: "Die-Cut Handle",
    image: "/images/photo_17_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_17_2026-09-05_00-36-03.jpg",
      "/images/photo_12_2026-09-05_00-36-03.jpg"
    ],
    badge: "Executive",
    description: "Sleek, professional die-cut handle bag with matte black lamination and silver foil stamping. Ideal for corporate events and high-end tech accessories.",
    dimensions: "20cm × 25cm + 8cm gusset",
    material: "250 GSM Matte Coated Kraft",
  }
];

async function run() {
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Connected to Supabase");

    // 1. Add extra columns to products table if they don't exist
    console.log("Adding metadata columns to products table...");
    await client.query(`
      ALTER TABLE public.products
      ADD COLUMN IF NOT EXISTS client TEXT,
      ADD COLUMN IF NOT EXISTS category TEXT,
      ADD COLUMN IF NOT EXISTS bundle_size INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS gsm INTEGER,
      ADD COLUMN IF NOT EXISTS handle_type TEXT,
      ADD COLUMN IF NOT EXISTS badge TEXT,
      ADD COLUMN IF NOT EXISTS dimensions TEXT,
      ADD COLUMN IF NOT EXISTS material TEXT;
    `);
    
    // Clear existing products to prevent duplicates for this script
    await client.query(`DELETE FROM public.products`);
    
    // 2. Insert products
    console.log("Inserting catalog products...");
    for (const p of PRODUCTS_CATALOG) {
      const query = `
        INSERT INTO public.products (
          name, description, price, image_urls, client, category, bundle_size, gsm, handle_type, badge, dimensions, material
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
      `;
      
      await client.query(query, [
        p.name, p.description, p.price, p.gallery, p.client, p.category, p.bundleSize, p.gsm, p.handleType, p.badge || null, p.dimensions, p.material
      ]);
    }

    console.log("✅ Products inserted successfully");
  } catch (err) {
    console.error("Error migrating products:", err);
  } finally {
    await client.end();
  }
}

run();

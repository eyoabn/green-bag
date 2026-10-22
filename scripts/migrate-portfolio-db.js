'use strict';
const { Client } = require('pg');

const DIRECT_URL =
  process.env.DIRECT_URL ||
  'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

const PORTFOLIO_PROJECTS = [
  {
    id: "proj-rare-coffee",
    title: "Specialty Degassing Gusset Pouch & Carrier",
    client: "Rare Coffee Roasters",
    category: "Coffee & Food",
    sector: "Specialty Coffee Export & Roasting",
    location: "Addis Ababa, Ethiopia (Sarbet)",
    batch_size: "45,000 Units",
    gsm: 220,
    handle_type: "High-Tensile Black Twisted Cord",
    print_finish: "Botanical Vegetable Ink Screenprint",
    dimensions: "24cm × 28cm + 10cm Gusset",
    image: "/images/photo_6_2026-09-05_00-36-03.jpg",
    secondary_images: ["/images/photo_13_2026-09-05_00-36-03.jpg"],
    year: "2026",
    featured: true,
    description: "Engineered specifically for single-origin Yirgacheffe and Sidama whole-bean coffee packaging. Heavy-duty unbleached Ethiopian kraft with grease-resistant barrier lining, heat-sealable top, and custom typography celebrating Ethiopian roast heritage.",
    client_quote: "Arenguade replaced our imported plastic pouches with authentic Ethiopian unbleached kraft that our international green coffee buyers continually compliment."
  },
  {
    id: "proj-richos-boutique",
    title: "Luxury Apparel Shopper with Traditional Tibeb Border",
    client: "Richo's Clothing Boutique",
    category: "Luxury Fashion",
    sector: "High-End Ethiopian Fashion & Habesha Kemis",
    location: "Bole Medhanealem, Addis Ababa",
    batch_size: "30,000 Units",
    gsm: 250,
    handle_type: "Soft Woven Cotton Rope with Reinforced Eyelets",
    print_finish: "Dual-Tone Screenprint with Geometric Tibeb Border",
    dimensions: "32cm × 36cm + 12cm Gusset",
    image: "/images/photo_3_2026-09-05_00-36-02.jpg",
    secondary_images: ["/images/photo_4_2026-09-05_00-36-02.jpg"],
    year: "2026",
    featured: true,
    description: "Designed for premium boutique garments, suits, and hand-embroidered Habesha dresses. Features a rigid 400 GSM bottom reinforcement card and hand-finished cotton handles that ensure zero tearing under heavy garment loads.",
    client_quote: "The structural stiffness and the Tibeb border design elevated our brand presence throughout Bole shopping centers."
  },
  {
    id: "proj-hassan-adama",
    title: "Monochrome VIP Retail Shopper",
    client: "Hassan Adama Boutique",
    category: "Luxury Fashion",
    sector: "Men's Tailoring & Footwear",
    location: "Adama, Oromia Region",
    batch_size: "20,000 Units",
    gsm: 240,
    handle_type: "Black Braided Cord Handles",
    print_finish: "Matte Black Pigment with Metallic Gold Accent",
    dimensions: "30cm × 34cm + 12cm Gusset",
    image: "/images/photo_4_2026-09-05_00-36-02.jpg",
    secondary_images: ["/images/photo_3_2026-09-05_00-36-02.jpg"],
    year: "2026",
    featured: true,
    description: "Minimalist executive packaging line featuring crisp architectural typography and high contrast brand mark. Produced using virgin bleached kraft with a velvety matte surface finish.",
    client_quote: "Our clients in Adama keep and reuse these bags for months. The quality is equal to luxury brands in Dubai or Milan."
  },
  {
    id: "proj-vero-tiramisu",
    title: "Artisanal Pastry & Cake Box Carrier",
    client: "Véro Tiramisù & Italian Bakery",
    category: "Coffee & Food",
    sector: "Artisan Bakery & Gourmet Patisserie",
    location: "Kazanchis, Addis Ababa",
    batch_size: "35,000 Units",
    gsm: 200,
    handle_type: "Flat Fold Heavy Kraft Handles",
    print_finish: "Food-Safe Water-Based Inks",
    dimensions: "26cm × 22cm + 16cm Extra-Wide Flat Gusset",
    image: "/images/photo_9_2026-09-05_00-36-03.jpg",
    secondary_images: [
      "/images/photo_14_2026-09-05_00-36-03.jpg",
      "/images/photo_16_2026-09-05_00-36-03.jpg",
      "/images/photo_18_2026-09-05_00-36-03.jpg"
    ],
    year: "2026",
    featured: true,
    description: "Custom wide-gusset paper bag specifically designed to keep square dessert containers and tiramisù boxes strictly horizontal during customer transit, preventing tipping or cream displacement.",
    client_quote: "Having a stable flat base for our delicate dessert boxes was critical. Arenguade delivered perfection."
  },
  {
    id: "proj-caneth-hotel",
    title: "VIP Guest Amenities & Suite Carrier",
    client: "Caneth Hotel & Suites",
    category: "Hospitality",
    sector: "Four-Star Hospitality & Executive Lodging",
    location: "Addis Ababa Airport Corridor",
    batch_size: "15,000 Units",
    gsm: 200,
    handle_type: "Satin Ribbon with Eyelet Anchors",
    print_finish: "Embossed Brand Crest with Forest Green Inks",
    dimensions: "22cm × 28cm + 10cm Gusset",
    image: "/images/photo_5_2026-09-05_00-36-02.jpg",
    secondary_images: [],
    year: "2026",
    featured: true,
    description: "Bespoke welcome bag for VIP diplomatic guests and airline transit travelers. Contains room amenities, Ethiopian organic honey jars, and souvenir guidebooks.",
    client_quote: "Gives our international hotel guests a warm, sustainable Ethiopian welcome from the moment they step into their suite."
  },
  {
    id: "proj-cheru-medhanealem",
    title: "Ceremonial & Spiritual Keepsake Tote",
    client: "Cheru Medhanealem Ceremonial Guild",
    category: "Ceremonial & Gifts",
    sector: "Religious & Cultural Souvenirs",
    location: "Addis Ababa, Ethiopia",
    batch_size: "50,000 Units",
    gsm: 240,
    handle_type: "Braided Crimson Red Rope",
    print_finish: "Traditional Ethiopic Script & Cross Motif Screenprint",
    dimensions: "28cm × 32cm + 10cm Gusset",
    image: "/images/photo_1_2026-09-05_00-36-02.jpg",
    secondary_images: [
      "/images/photo_2_2026-09-05_00-36-02.jpg",
      "/images/photo_15_2026-09-05_00-36-03.jpg"
    ],
    year: "2025",
    featured: true,
    description: "Celebration carrier featuring vibrant scarlet rope handles, Amharic religious calligraphy, and heavy structural kraft. Created for church celebrations, weddings, and community feast keepsakes.",
    client_quote: "The crimson handles and golden motifs added tremendous reverence to our holiday celebrations."
  },
  {
    id: "proj-family-dental",
    title: "Clinical Oral Care & Pharmaceutical Carrier",
    client: "Family Dental Clinic",
    category: "Healthcare",
    sector: "Specialized Healthcare & Dental Surgery",
    location: "Bole Atlas, Addis Ababa",
    batch_size: "25,000 Units",
    gsm: 160,
    handle_type: "Reinforced Twisted Paper Cord",
    print_finish: "Medical Cyan Screenprint",
    dimensions: "20cm × 24cm + 8cm Gusset",
    image: "/images/photo_10_2026-09-05_00-36-03.jpg",
    secondary_images: [],
    year: "2026",
    featured: false,
    description: "Hygienic, crisp white-backed kraft carrier for patient post-op kits, prescription care packs, and hygiene supplies, replacing thin dispensary plastic bags.",
    client_quote: "Our patients love leaving our clinic with a clean, medical-grade paper bag rather than flimsy disposable plastic."
  },
  {
    id: "proj-laaguujii",
    title: "Artisan Leathercraft & Heritage Carrier",
    client: "Laaguujii Taarikee Leather & Crafts",
    category: "Ceremonial & Gifts",
    sector: "Handcrafted Goods & Souvenirs",
    location: "Hawassa, Sidama Region",
    batch_size: "18,000 Units",
    gsm: 220,
    handle_type: "Raw Brown Twisted Kraft Cord",
    print_finish: "Natural Earth Pigment",
    dimensions: "26cm × 30cm + 10cm Gusset",
    image: "/images/photo_8_2026-09-05_00-36-03.jpg",
    secondary_images: [],
    year: "2025",
    featured: false,
    description: "Uncoated raw natural brown kraft bag highlighting the organic fibrous texture of locally sourced recycled cellulose pulp.",
    client_quote: "Pairs flawlessly with our handcrafted Sidama leather belts and wallets."
  },
  {
    id: "proj-liora-fashion",
    title: "Minimalist Modern Apparel Bag",
    client: "Liora Fashion Store",
    category: "Luxury Fashion",
    sector: "Contemporary Women's Ready-to-Wear",
    location: "Edna Mall Area, Addis Ababa",
    batch_size: "22,000 Units",
    gsm: 210,
    handle_type: "Woven Cotton Ribbon",
    print_finish: "Minimalist Typographic Screenprint",
    dimensions: "28cm × 34cm + 11cm Gusset",
    image: "/images/photo_13_2026-09-05_00-36-03.jpg",
    secondary_images: [],
    year: "2026",
    featured: false,
    description: "High-contrast minimalist layout tailored for boutique retail, showcasing clean typography on certified sustainable kraft.",
    client_quote: "Clean lines and exceptional finish that our customers love carrying through the city."
  },
  {
    id: "proj-arenguade-guild",
    title: "Factory Roll-Fed Kraft Converting & Precision Folding",
    client: "Arenguade Central Production Guild",
    category: "Industrial Guild",
    sector: "Industrial Eco-Manufacturing Facility",
    location: "Bole Lemi Industrial Zone, Addis Ababa",
    batch_size: "250,000 Units / Mo",
    gsm: 280,
    handle_type: "Automated Twisted & Folded Line",
    print_finish: "Multi-Station Flexo & Screenprinting",
    dimensions: "Custom Industrial Sizes",
    image: "/images/photo_7_2026-09-05_00-36-03.jpg",
    secondary_images: [
      "/images/photo_11_2026-09-05_00-36-03.jpg",
      "/images/photo_12_2026-09-05_00-36-03.jpg",
      "/images/photo_17_2026-09-05_00-36-03.jpg"
    ],
    year: "2026",
    featured: true,
    description: "Inside our Addis Ababa converting facility: raw roll-fed high-tensile paper undergoing automated creasing, gusset formation, bottom pasting, and rigorous pressure testing.",
    client_quote: "Our production facility proves that 100% Ethiopian paper converting can compete directly with global packaging suppliers on quality, strength, and speed."
  }
];

async function main() {
  const client = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('1. Creating public.portfolio_projects table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.portfolio_projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      client TEXT NOT NULL,
      category TEXT NOT NULL,
      sector TEXT NOT NULL,
      location TEXT NOT NULL,
      batch_size TEXT NOT NULL,
      gsm INTEGER NOT NULL,
      handle_type TEXT NOT NULL,
      print_finish TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      image TEXT NOT NULL,
      secondary_images TEXT[] DEFAULT '{}',
      year TEXT NOT NULL,
      featured BOOLEAN DEFAULT true,
      description TEXT NOT NULL,
      client_quote TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `);

  console.log('2. Enabling RLS on public.portfolio_projects...');
  await client.query(`
    ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public portfolio projects are viewable by everyone" ON public.portfolio_projects;
    CREATE POLICY "Public portfolio projects are viewable by everyone" ON public.portfolio_projects FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Admins can manage portfolio projects" ON public.portfolio_projects;
    CREATE POLICY "Admins can manage portfolio projects" ON public.portfolio_projects FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );
  `);

  console.log('3. Seeding portfolio projects into database...');
  for (const p of PORTFOLIO_PROJECTS) {
    await client.query(`
      INSERT INTO public.portfolio_projects (
        id, title, client, category, sector, location, batch_size, gsm, handle_type,
        print_finish, dimensions, image, secondary_images, year, featured, description, client_quote
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        client = EXCLUDED.client,
        category = EXCLUDED.category,
        sector = EXCLUDED.sector,
        location = EXCLUDED.location,
        batch_size = EXCLUDED.batch_size,
        gsm = EXCLUDED.gsm,
        handle_type = EXCLUDED.handle_type,
        print_finish = EXCLUDED.print_finish,
        dimensions = EXCLUDED.dimensions,
        image = EXCLUDED.image,
        secondary_images = EXCLUDED.secondary_images,
        year = EXCLUDED.year,
        featured = EXCLUDED.featured,
        description = EXCLUDED.description,
        client_quote = EXCLUDED.client_quote;
    `, [
      p.id, p.title, p.client, p.category, p.sector, p.location, p.batch_size, p.gsm,
      p.handle_type, p.print_finish, p.dimensions, p.image, p.secondary_images, p.year,
      p.featured, p.description, p.client_quote
    ]);
  }

  const res = await client.query('SELECT COUNT(*) FROM public.portfolio_projects');
  console.log(`✅ Success! Seeded portfolio_projects row count: ${res.rows[0].count}`);

  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

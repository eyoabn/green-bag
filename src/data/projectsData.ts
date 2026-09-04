export interface ProjectWork {
  id: string;
  title: string;
  client: string;
  category: "Coffee & Food" | "Luxury Fashion" | "Hospitality" | "Healthcare" | "Ceremonial & Gifts" | "Industrial Guild";
  sector: string;
  location: string;
  batchSize: string;
  gsm: number;
  handleType: string;
  printFinish: string;
  dimensions: string;
  image: string;
  secondaryImages?: string[];
  year: string;
  featured: boolean;
  description: string;
  clientQuote?: string;
}

export const PROJECTS_WORKS: ProjectWork[] = [
  {
    id: "proj-rare-coffee",
    title: "Specialty Degassing Gusset Pouch & Carrier",
    client: "Rare Coffee Roasters",
    category: "Coffee & Food",
    sector: "Specialty Coffee Export & Roasting",
    location: "Addis Ababa, Ethiopia (Sarbet)",
    batchSize: "45,000 Units",
    gsm: 220,
    handleType: "High-Tensile Black Twisted Cord",
    printFinish: "Botanical Vegetable Ink Screenprint",
    dimensions: "24cm × 28cm + 10cm Gusset",
    image: "/images/photo_6_2026-09-05_00-36-03.jpg",
    secondaryImages: [
      "/images/photo_13_2026-09-05_00-36-03.jpg"
    ],
    year: "2026",
    featured: true,
    description: "Engineered specifically for single-origin Yirgacheffe and Sidama whole-bean coffee packaging. Heavy-duty unbleached Ethiopian kraft with grease-resistant barrier lining, heat-sealable top, and custom typography celebrating Ethiopian roast heritage.",
    clientQuote: "Arenguade replaced our imported plastic pouches with authentic Ethiopian unbleached kraft that our international green coffee buyers continually compliment."
  },
  {
    id: "proj-richos-boutique",
    title: "Luxury Apparel Shopper with Traditional Tibeb Border",
    client: "Richo's Clothing Boutique",
    category: "Luxury Fashion",
    sector: "High-End Ethiopian Fashion & Habesha Kemis",
    location: "Bole Medhanealem, Addis Ababa",
    batchSize: "30,000 Units",
    gsm: 250,
    handleType: "Soft Woven Cotton Rope with Reinforced Eyelets",
    printFinish: "Dual-Tone Screenprint with Geometric Tibeb Border",
    dimensions: "32cm × 36cm + 12cm Gusset",
    image: "/images/photo_3_2026-09-05_00-36-02.jpg",
    secondaryImages: [
      "/images/photo_4_2026-09-05_00-36-02.jpg"
    ],
    year: "2026",
    featured: true,
    description: "Designed for premium boutique garments, suits, and hand-embroidered Habesha dresses. Features a rigid 400 GSM bottom reinforcement card and hand-finished cotton handles that ensure zero tearing under heavy garment loads.",
    clientQuote: "The structural stiffness and the Tibeb border design elevated our brand presence throughout Bole shopping centers."
  },
  {
    id: "proj-hassan-adama",
    title: "Monochrome VIP Retail Shopper",
    client: "Hassan Adama Boutique",
    category: "Luxury Fashion",
    sector: "Men's Tailoring & Footwear",
    location: "Adama, Oromia Region",
    batchSize: "20,000 Units",
    gsm: 240,
    handleType: "Black Braided Cord Handles",
    printFinish: "Matte Black Pigment with Metallic Gold Accent",
    dimensions: "30cm × 34cm + 12cm Gusset",
    image: "/images/photo_4_2026-09-05_00-36-02.jpg",
    secondaryImages: [
      "/images/photo_3_2026-09-05_00-36-02.jpg"
    ],
    year: "2026",
    featured: true,
    description: "Minimalist executive packaging line featuring crisp architectural typography and high contrast brand mark. Produced using virgin bleached kraft with a velvety matte surface finish.",
    clientQuote: "Our clients in Adama keep and reuse these bags for months. The quality is equal to luxury brands in Dubai or Milan."
  },
  {
    id: "proj-vero-tiramisu",
    title: "Artisanal Pastry & Cake Box Carrier",
    client: "Véro Tiramisù & Italian Bakery",
    category: "Coffee & Food",
    sector: "Artisan Bakery & Gourmet Patisserie",
    location: "Kazanchis, Addis Ababa",
    batchSize: "35,000 Units",
    gsm: 200,
    handleType: "Flat Fold Heavy Kraft Handles",
    printFinish: "Food-Safe Water-Based Inks",
    dimensions: "26cm × 22cm + 16cm Extra-Wide Flat Gusset",
    image: "/images/photo_9_2026-09-05_00-36-03.jpg",
    secondaryImages: [
      "/images/photo_14_2026-09-05_00-36-03.jpg",
      "/images/photo_16_2026-09-05_00-36-03.jpg",
      "/images/photo_18_2026-09-05_00-36-03.jpg"
    ],
    year: "2026",
    featured: true,
    description: "Custom wide-gusset paper bag specifically designed to keep square dessert containers and tiramisù boxes strictly horizontal during customer transit, preventing tipping or cream displacement.",
    clientQuote: "Having a stable flat base for our delicate dessert boxes was critical. Arenguade delivered perfection."
  },
  {
    id: "proj-caneth-hotel",
    title: "VIP Guest Amenities & Suite Carrier",
    client: "Caneth Hotel & Suites",
    category: "Hospitality",
    sector: "Four-Star Hospitality & Executive Lodging",
    location: "Addis Ababa Airport Corridor",
    batchSize: "15,000 Units",
    gsm: 200,
    handleType: "Satin Ribbon with Eyelet Anchors",
    printFinish: "Embossed Brand Crest with Forest Green Inks",
    dimensions: "22cm × 28cm + 10cm Gusset",
    image: "/images/photo_5_2026-09-05_00-36-02.jpg",
    year: "2026",
    featured: true,
    description: "Bespoke welcome bag for VIP diplomatic guests and airline transit travelers. Contains room amenities, Ethiopian organic honey jars, and souvenir guidebooks.",
    clientQuote: "Gives our international hotel guests a warm, sustainable Ethiopian welcome from the moment they step into their suite."
  },
  {
    id: "proj-cheru-medhanealem",
    title: "Ceremonial & Spiritual Keepsake Tote",
    client: "Cheru Medhanealem Ceremonial Guild",
    category: "Ceremonial & Gifts",
    sector: "Religious & Cultural Souvenirs",
    location: "Addis Ababa, Ethiopia",
    batchSize: "50,000 Units",
    gsm: 240,
    handleType: "Braided Crimson Red Rope",
    printFinish: "Traditional Ethiopic Script & Cross Motif Screenprint",
    dimensions: "28cm × 32cm + 10cm Gusset",
    image: "/images/photo_1_2026-09-05_00-36-02.jpg",
    secondaryImages: [
      "/images/photo_2_2026-09-05_00-36-02.jpg",
      "/images/photo_15_2026-09-05_00-36-03.jpg"
    ],
    year: "2025",
    featured: true,
    description: "Celebration carrier featuring vibrant scarlet rope handles, Amharic religious calligraphy, and heavy structural kraft. Created for church celebrations, weddings, and community feast keepsakes.",
    clientQuote: "The crimson handles and golden motifs added tremendous reverence to our holiday celebrations."
  },
  {
    id: "proj-family-dental",
    title: "Clinical Oral Care & Pharmaceutical Carrier",
    client: "Family Dental Clinic",
    category: "Healthcare",
    sector: "Specialized Healthcare & Dental Surgery",
    location: "Bole Atlas, Addis Ababa",
    batchSize: "25,000 Units",
    gsm: 160,
    handleType: "Reinforced Twisted Paper Cord",
    printFinish: "Medical Cyan Screenprint",
    dimensions: "20cm × 24cm + 8cm Gusset",
    image: "/images/photo_10_2026-09-05_00-36-03.jpg",
    year: "2026",
    featured: false,
    description: "Hygienic, crisp white-backed kraft carrier for patient post-op kits, prescription care packs, and hygiene supplies, replacing thin dispensary plastic bags.",
    clientQuote: "Our patients love leaving our clinic with a clean, medical-grade paper bag rather than flimsy disposable plastic."
  },
  {
    id: "proj-laaguujii",
    title: "Artisan Leathercraft & Heritage Carrier",
    client: "Laaguujii Taarikee Leather & Crafts",
    category: "Ceremonial & Gifts",
    sector: "Handcrafted Goods & Souvenirs",
    location: "Hawassa, Sidama Region",
    batchSize: "18,000 Units",
    gsm: 220,
    handleType: "Raw Brown Twisted Kraft Cord",
    printFinish: "Natural Earth Pigment",
    dimensions: "26cm × 30cm + 10cm Gusset",
    image: "/images/photo_8_2026-09-05_00-36-03.jpg",
    year: "2025",
    featured: false,
    description: "Uncoated raw natural brown kraft bag highlighting the organic fibrous texture of locally sourced recycled cellulose pulp.",
    clientQuote: "Pairs flawlessly with our handcrafted Sidama leather belts and wallets."
  },
  {
    id: "proj-liora-fashion",
    title: "Minimalist Modern Apparel Bag",
    client: "Liora Fashion Store",
    category: "Luxury Fashion",
    sector: "Contemporary Women's Ready-to-Wear",
    location: "Edna Mall Area, Addis Ababa",
    batchSize: "22,000 Units",
    gsm: 210,
    handleType: "Woven Cotton Ribbon",
    printFinish: "Minimalist Typographic Screenprint",
    dimensions: "28cm × 34cm + 11cm Gusset",
    image: "/images/photo_13_2026-09-05_00-36-03.jpg",
    year: "2026",
    featured: false,
    description: "High-contrast minimalist layout tailored for boutique retail, showcasing clean typography on certified sustainable kraft.",
    clientQuote: "Clean lines and exceptional finish that our customers love carrying through the city."
  },
  {
    id: "proj-arenguade-guild",
    title: "Factory Roll-Fed Kraft Converting & Precision Folding",
    client: "Arenguade Central Production Guild",
    category: "Industrial Guild",
    sector: "Industrial Eco-Manufacturing Facility",
    location: "Bole Lemi Industrial Zone, Addis Ababa",
    batchSize: "250,000 Units / Mo",
    gsm: 280,
    handleType: "Automated Twisted & Folded Line",
    printFinish: "Multi-Station Flexo & Screenprinting",
    dimensions: "Custom Industrial Sizes",
    image: "/images/photo_7_2026-09-05_00-36-03.jpg",
    secondaryImages: [
      "/images/photo_11_2026-09-05_00-36-03.jpg",
      "/images/photo_12_2026-09-05_00-36-03.jpg",
      "/images/photo_17_2026-09-05_00-36-03.jpg"
    ],
    year: "2026",
    featured: true,
    description: "Inside our Addis Ababa converting facility: raw roll-fed high-tensile paper undergoing automated creasing, gusset formation, bottom pasting, and rigorous pressure testing.",
    clientQuote: "Our production facility proves that 100% Ethiopian paper converting can compete directly with global packaging suppliers on quality, strength, and speed."
  }
];

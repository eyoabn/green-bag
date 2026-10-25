"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Building2, 
  Phone, 
  Mail, 
  PenTool, 
  ArrowRight,
  Maximize2,
  X,
  FileText
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

export interface ProductDetail {
  id: string;
  name: string;
  client?: string;
  category: string;
  price: number;
  bundleSize?: number;
  gsm?: number;
  handleType?: string;
  image: string;
  gallery: string[];
  badge?: string;
  description: string;
  dimensions?: string;
  material?: string;
  is_available?: boolean;
  is_client_work?: boolean;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const { lang, t } = useLanguage();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string>("/images/photo_6_2026-09-05_00-36-03.jpg");
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      const supabase = createClient();

      try {
        const { data: dbProduct } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .maybeSingle();

        if (dbProduct) {
          const detail: ProductDetail = {
            id: dbProduct.id,
            name: dbProduct.name,
            client: dbProduct.client || "Ethiopian Enterprise Partner",
            category: dbProduct.category || "B2B Custom Packaging",
            price: Number(dbProduct.price || 0),
            bundleSize: dbProduct.bundle_size || 100,
            gsm: dbProduct.gsm || 220,
            handleType: dbProduct.handle_type || "Twisted Kraft Paper Cord",
            image: dbProduct.image_url || "/images/photo_6_2026-09-05_00-36-03.jpg",
            gallery: dbProduct.gallery_urls && dbProduct.gallery_urls.length > 0 
              ? dbProduct.gallery_urls 
              : [dbProduct.image_url || "/images/photo_6_2026-09-05_00-36-03.jpg"],
            badge: dbProduct.badge || "Client Showcase Deliverable",
            description: dbProduct.description || "Precision engineered sustainable paper packaging manufactured at our Addis Ababa production plant.",
            dimensions: dbProduct.dimensions || "26cm × 32cm + 10cm Gusset",
            material: dbProduct.material || "100% Recycled Biodegradable Kraft",
            is_available: dbProduct.is_available ?? true,
            is_client_work: dbProduct.is_client_work ?? true,
          };
          setProduct(detail);
          setSelectedImage(detail.image);
        }
      } catch (err) {
        console.error("Failed to load product showcase:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] pt-24 pb-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Sparkles size={32} className="animate-spin text-[#1E3B2E] mx-auto" />
          <p className="font-serif text-lg font-bold text-stone-800">Loading Packaging Deliverable Showcase...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] pt-28 pb-16 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-stone-200 text-center space-y-4">
          <FileText size={40} className="text-stone-400 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-stone-900">Showcase Item Not Found</h2>
          <p className="text-xs text-stone-500">This packaging piece may have been updated or archived.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Portfolio</span>
          </Link>
        </div>
      </div>
    );
  }

  const commissionUrl = `/design-submission?preset=${encodeURIComponent(product.name)}&gsm=${product.gsm || 220}&dimensions=${encodeURIComponent(product.dimensions || "")}&handle=${encodeURIComponent(product.handleType || "")}`;

  return (
    <div className="min-h-screen bg-[#F9F6F0] pt-20 sm:pt-24 pb-28 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#8C4B31] transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            <span>{lang === "am" ? "ወደ ካታሎግ ተመለስ" : "Back to Packaging Showcase"}</span>
          </Link>

          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] border border-[#1E3B2E]/20">
            {product.badge || "Client Deliverable Showcase"}
          </span>
        </div>

        {/* Main Showcase Presentation Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden p-6 sm:p-10 mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Imagery (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div 
                onClick={() => setLightboxOpen(true)}
                className="relative aspect-4/5 w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 cursor-zoom-in group shadow-xs"
              >
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  priority
                />
                <div className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs text-stone-800 shadow-md opacity-80 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={16} />
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {product.gallery && product.gallery.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {product.gallery.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        selectedImage === img ? "border-[#1E3B2E] scale-105 shadow-xs" : "border-stone-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image src={img} alt={`View ${idx + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Narrative, Engineering Specs & Commission Action (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
                    {product.category}
                  </span>
                  <span>•</span>
                  <span className="text-xs text-stone-500 font-semibold">
                    Client: <strong>{product.client}</strong>
                  </span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
                  {product.name}
                </h1>
                
                <p className="text-stone-600 text-sm mt-3 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Client Exclusivity & Manufacturing Notice */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-amber-200/80 text-xs text-stone-700 flex items-start gap-3">
                <ShieldCheck size={18} className="text-[#8C4B31] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-stone-900 block mb-0.5">
                    {lang === "am" ? "የደንበኛ ማሸጊያ ሾውኬዝ (ለቀጥታ ሽያጭ የቀረበ አይደለም)" : "Client Case Study (Showcase Only — Not for Direct Retail Sale)"}
                  </span>
                  <span>
                    {lang === "am"
                      ? "ይህ ማሸጊያ ለተወሰነ የኢትዮጵያ ደንበኛ በልዩ ትዕዛዝ የተመረተ ነው። የደንበኛውን የብራንድ ጥበቃ በመከተል በሌላ ሰው ሎጎ የተሰራ ቦርሳ ለቀጥታ ሽያጭ አይቀርብም። ይልቁንስ ይህንን ተመሳሳይ መዋቅር በራስዎ ሎጎ እና መጠን ማዘዝ ይችላሉ።"
                      : "This packaging was custom-manufactured exclusively for our partner client. To protect brand trademarks, arbitrary retail sales cannot be placed for this branded packaging. You can commission this exact structural profile custom-manufactured with your own company logo."}
                  </span>
                </div>
              </div>

              {/* Technical Engineering Specifications Grid */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Layers size={14} className="text-[#1E3B2E]" />
                  <span>{lang === "am" ? "የቴክኒክ ዝርዝሮች" : "Engineering Specifications"}</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200/80">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Dimensions</span>
                    <span className="font-bold text-stone-900">{product.dimensions}</span>
                  </div>

                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200/80">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Paper Weight</span>
                    <span className="font-bold text-stone-900">{product.gsm} GSM Kraft</span>
                  </div>

                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200/80">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Handle Type</span>
                    <span className="font-bold text-stone-900">{product.handleType}</span>
                  </div>

                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200/80">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Material</span>
                    <span className="font-bold text-stone-900">{product.material}</span>
                  </div>

                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200/80">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Origin</span>
                    <span className="font-bold text-stone-900">Manufactured in Addis Ababa</span>
                  </div>

                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200/80">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Eco Standard</span>
                    <span className="font-bold text-emerald-800">100% Recyclable</span>
                  </div>

                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200/80">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Turnaround</span>
                    <span className="font-bold text-stone-900">5-7 Business Days</span>
                  </div>
                </div>
              </div>

              {/* PRIMARY B2B ACTION: COMMISSION CUSTOM DESIGN */}
              <div className="p-6 rounded-3xl bg-[#1E3B2E] text-white space-y-4 shadow-md">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#E0B382]" />
                  <h3 className="font-serif text-lg font-bold text-white">
                    {lang === "am" ? "የራስዎን ብጁ ባች በብራንድዎ ያመርቱ" : "Commission Your Brand's Custom Batch"}
                  </h3>
                </div>

                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  {lang === "am"
                    ? "ይህንን ተመሳሳይ ጥራት እና መጠን በራስዎ የድርጅት ሎጎ፣ ቀለሞች እና አሻራ ማምረት ይፈልጋሉ? በዲዛይን ስቱዲዮአችን ውስጥ ወዲያውኑ መጠን ይምረጡ፣ ሎጎዎን ይጫኑ እና የዋጋ ግምት ያግኙ።"
                    : "Want this exact packaging structure custom-branded with your company logo, pantone colors, and tailored dimensions? We manufacture custom production runs for roasters, fashion boutiques, hotels, and retail brands across Ethiopia."}
                </p>

                <div className="pt-1">
                  <Link
                    href={commissionUrl}
                    className="w-full py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-[#8C4B31] hover:bg-[#A3593B] text-white rounded-full transition-all shadow-md cursor-pointer"
                  >
                    <PenTool size={15} />
                    <span>{lang === "am" ? "ይህንን ዲዛይን በራስዎ ሎጎ ይዘዙ" : "Commission Similar Custom Design &rarr;"}</span>
                  </Link>
                </div>
              </div>

              {/* Factory Hotline & Direct Enterprise Desk */}
              <div className="p-4 bg-white rounded-2xl border border-stone-200 text-xs text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-stone-900 block">Addis Ababa Plant Engineering Desk</span>
                  <span className="text-[11px] text-stone-500">Bole Subcity, Industrial Zone • Direct WhatsApp / Phone Inquiries</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href="tel:+251911741618"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold"
                  >
                    <Phone size={13} className="text-[#1E3B2E]" />
                    <span>+251 911 741618</span>
                  </a>
                  <a
                    href="mailto:orders@arenguade.et"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold"
                  >
                    <Mail size={13} className="text-[#8C4B31]" />
                    <span>Email Desk</span>
                  </a>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Lightbox Modal for High-Resolution Inspection */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
          >
            <X size={24} />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
}

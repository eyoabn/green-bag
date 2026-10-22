import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PROJECTS_WORKS, ProjectWork } from "@/data/projectsData";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Query published products and portfolio items from PostgreSQL
    const { data: dbProducts, error } = await supabase
      .from("products")
      .select("id, name, description, price, images, category, created_at")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Merge database manufactured products into the portfolio presentation format
    const dbProjects: ProjectWork[] = (dbProducts || []).map((p) => {
      const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "/images/photo_6_2026-09-05_00-36-03.jpg";
      const secondary = Array.isArray(p.images) && p.images.length > 1 ? p.images.slice(1) : [];

      let mappedCat: ProjectWork["category"] = "Industrial Guild";
      const catLower = (p.category || "").toLowerCase();
      if (catLower.includes("coffee") || catLower.includes("food")) mappedCat = "Coffee & Food";
      else if (catLower.includes("luxury") || catLower.includes("boutique") || catLower.includes("fashion")) mappedCat = "Luxury Fashion";
      else if (catLower.includes("hospitality") || catLower.includes("hotel")) mappedCat = "Hospitality";
      else if (catLower.includes("gift") || catLower.includes("ceremonial")) mappedCat = "Ceremonial & Gifts";

      return {
        id: `db-prod-${p.id}`,
        title: p.name,
        client: "Arenguade Industrial Production",
        category: mappedCat,
        sector: "Eco Paper Manufacturing",
        location: "Addis Ababa, Ethiopia",
        batchSize: "Wholesale & Custom Orders",
        gsm: 200,
        handleType: "Twisted Kraft / Ribbon Handle",
        printFinish: "Precision Screenprint",
        dimensions: "Custom Order Sizes",
        image: img,
        secondaryImages: secondary,
        year: new Date(p.created_at || Date.now()).getFullYear().toString(),
        featured: true,
        description: p.description || "Authentic heavy-duty Ethiopian kraft paper packaging manufactured for commercial brands.",
      };
    });

    // Combine database products with curated industrial showcase works
    const combinedProjects = [...dbProjects, ...PROJECTS_WORKS];

    return NextResponse.json({
      success: true,
      projects: combinedProjects,
      total: combinedProjects.length,
    });
  } catch (err: any) {
    // Return curated portfolio as resilient fallback
    return NextResponse.json({
      success: true,
      projects: PROJECTS_WORKS,
      total: PROJECTS_WORKS.length,
    });
  }
}

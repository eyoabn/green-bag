import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { type ProjectWork } from "@/data/projectsData";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. Query dedicated portfolio projects from public.portfolio_projects table
    const { data: dbPortfolio, error: portfolioError } = await supabase
      .from("portfolio_projects")
      .select("*")
      .order("featured", { ascending: false })
      .order("year", { ascending: false });

    if (portfolioError) {
      throw portfolioError;
    }

    const mappedPortfolio: ProjectWork[] = (dbPortfolio || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      client: p.client,
      category: p.category as ProjectWork["category"],
      sector: p.sector,
      location: p.location,
      batchSize: p.batch_size,
      gsm: Number(p.gsm),
      handleType: p.handle_type,
      printFinish: p.print_finish,
      dimensions: p.dimensions,
      image: p.image,
      secondaryImages: Array.isArray(p.secondary_images) ? p.secondary_images : [],
      year: p.year,
      featured: Boolean(p.featured),
      description: p.description,
      clientQuote: p.client_quote || undefined,
    }));

    // 2. Query published products from PostgreSQL to showcase active manufactured lines
    const { data: dbProducts, error: productsError } = await supabase
      .from("products")
      .select("id, name, description, price, images, category, created_at")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (productsError) {
      throw productsError;
    }

    const dbProductProjects: ProjectWork[] = (dbProducts || []).map((p: any) => {
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

    // Combine database portfolio records with database products
    const combinedProjects = [...mappedPortfolio, ...dbProductProjects];

    return NextResponse.json({
      success: true,
      projects: combinedProjects,
      total: combinedProjects.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to query portfolio from database",
        projects: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

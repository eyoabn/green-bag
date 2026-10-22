// Type definitions for portfolio projects.
// Live projects are stored in and served from PostgreSQL (public.portfolio_projects table via /api/portfolio).

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

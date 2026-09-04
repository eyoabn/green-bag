"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Sparkles, 
  Eye, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  MapPin, 
  Layers, 
  Maximize2,
  Calendar,
  Building2,
  Tag,
  PenTool
} from "lucide-react";
import { PROJECTS_WORKS, ProjectWork } from "@/data/projectsData";

export default function WorksPortfolioSection({ 
  limit, 
  showViewAllButton = true 
}: { 
  limit?: number; 
  showViewAllButton?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeModalWork, setActiveModalWork] = useState<ProjectWork | null>(null);
  const [activeModalImage, setActiveModalImage] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Projects" },
    { id: "Coffee & Food", label: "Coffee Roasters & Food" },
    { id: "Luxury Fashion", label: "Luxury & Boutiques" },
    { id: "Hospitality", label: "Hotels & Lodges" },
    { id: "Ceremonial & Gifts", label: "Gifts & Ceremonial" },
    { id: "Industrial Guild", label: "Factory & Guild" },
  ];

  const filteredProjects = PROJECTS_WORKS.filter((p) => {
    if (selectedCategory === "all") return true;
    return p.category === selectedCategory;
  });

  const displayedProjects = limit ? filteredProjects.slice(0, limit) : filteredProjects;

  const openNiceView = (project: ProjectWork) => {
    setActiveModalWork(project);
    setActiveModalImage(project.image);
  };

  const closeNiceView = () => {
    setActiveModalWork(null);
    setActiveModalImage(null);
  };

  return (
    <section id="portfolio" className="py-24 bg-[#F5EFEB] border-b border-stone-300/70 relative overflow-hidden">
      
      {/* Background Accent Gradients */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#8C4B31]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#1E3B2E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8C4B31]/10 border border-[#8C4B31]/20 text-[#8C4B31] text-xs font-bold uppercase tracking-widest mb-3">
              <Sparkles size={13} />
              Recent Works & Real Client Deliverables
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight">
              Delivered Projects Portfolio
            </h2>
            <p className="text-stone-600 text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
              Explore authentic high-volume packaging manufactured in Addis Ababa for Ethiopia&apos;s leading specialty coffee roasters, luxury boutiques, hotels, and ceremonial guilds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link 
              href="/design-submission"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-lg"
            >
              <PenTool size={15} />
              <span>Design Your Own Bag</span>
            </Link>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
                selectedCategory === cat.id
                  ? "bg-[#1E3B2E] text-white border-[#1E3B2E] shadow-sm"
                  : "bg-white/80 text-stone-700 border-stone-300/80 hover:bg-white hover:border-stone-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Portfolio Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedProjects.map((project) => (
            <div
              key={project.id}
              className="group bg-white rounded-3xl overflow-hidden border border-stone-300/70 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Image Container with "Nice View" Lightbox Trigger */}
                <div 
                  onClick={() => openNiceView(project)}
                  className="relative h-72 sm:h-80 w-full bg-stone-100 overflow-hidden cursor-pointer group-hover:brightness-95 transition-all"
                >
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-70 group-hover:opacity-80 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <span className="bg-[#1E3B2E]/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      {project.category}
                    </span>
                    <span className="bg-white/90 backdrop-blur-md text-stone-900 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                      {project.gsm} GSM
                    </span>
                  </div>

                  {/* "Nice View" Interactive Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-[#8C4B31] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Maximize2 size={14} />
                      <span>Nice View (Full Specs)</span>
                    </span>
                  </div>

                  {/* Client Name over image */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-[11px] font-semibold text-stone-200 tracking-wider uppercase flex items-center gap-1">
                      <MapPin size={11} className="text-[#D7A977]" />
                      {project.location}
                    </p>
                    <h3 className="font-serif text-xl font-bold text-white drop-shadow-sm line-clamp-1">
                      {project.client}
                    </h3>
                  </div>
                </div>

                {/* Card Body Details */}
                <div className="p-6">
                  <h4 className="font-serif text-lg font-bold text-stone-900 group-hover:text-[#8C4B31] transition-colors line-clamp-1 mb-2">
                    {project.title}
                  </h4>
                  <p className="text-stone-600 text-xs leading-relaxed line-clamp-2 mb-4">
                    {project.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAF7F2] p-3 rounded-2xl border border-stone-200/80">
                    <div>
                      <span className="text-stone-400 block font-medium">Batch Run:</span>
                      <span className="font-bold text-stone-800">{project.batchSize}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block font-medium">Handle:</span>
                      <span className="font-bold text-stone-800 truncate block">{project.handleType}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 pb-6 pt-2 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => openNiceView(project)}
                  className="text-xs font-bold text-[#8C4B31] hover:text-[#1E3B2E] transition-colors flex items-center gap-1"
                >
                  <Eye size={14} />
                  <span>Inspect Details</span>
                </button>

                <Link
                  href={`/design-submission?preset=${encodeURIComponent(project.title)}&gsm=${project.gsm}`}
                  className="px-4 py-2 rounded-full bg-[#1E3B2E]/10 hover:bg-[#1E3B2E] text-[#1E3B2E] hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                >
                  <span>Order Similar</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All / Explore Full Catalog Banner */}
        {showViewAllButton && limit && limit < filteredProjects.length && (
          <div className="text-center mt-16">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white border border-stone-300 text-stone-900 hover:bg-[#1E3B2E] hover:text-white text-xs font-bold tracking-wider uppercase transition-all shadow-sm hover:shadow-md"
            >
              <span>View All Delivered Client Projects ({PROJECTS_WORKS.length})</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* "NICE VIEW" FULL-SCREEN LIGHTBOX & DETAILED SPECIFICATION MODAL           */}
      {/* ========================================================================= */}
      {activeModalWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          
          <div 
            className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-stone-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Close Button */}
            <button
              onClick={closeNiceView}
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-md"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* Left: High-Res Interactive Image Viewer */}
            <div className="w-full md:w-1/2 bg-stone-950 relative min-h-[340px] md:min-h-[560px] flex flex-col justify-between p-4">
              
              <div className="relative flex-1 w-full rounded-2xl overflow-hidden">
                <Image
                  src={activeModalImage || activeModalWork.image}
                  alt={activeModalWork.title}
                  fill
                  priority
                  className="object-contain"
                />
              </div>

              {/* Secondary Image Thumbnails if available */}
              {activeModalWork.secondaryImages && activeModalWork.secondaryImages.length > 0 && (
                <div className="flex items-center gap-2 pt-3 justify-center">
                  <button
                    onClick={() => setActiveModalImage(activeModalWork.image)}
                    className={`relative w-16 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      activeModalImage === activeModalWork.image ? "border-[#E0B382] scale-105" : "border-stone-700 opacity-60"
                    }`}
                  >
                    <Image src={activeModalWork.image} alt="Thumb 1" fill className="object-cover" />
                  </button>
                  {activeModalWork.secondaryImages.map((secImg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveModalImage(secImg)}
                      className={`relative w-16 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        activeModalImage === secImg ? "border-[#E0B382] scale-105" : "border-stone-700 opacity-60"
                      }`}
                    >
                      <Image src={secImg} alt={`Thumb ${idx + 2}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="text-center pt-2">
                <span className="text-[10px] text-stone-400 font-medium">
                  High-Resolution Physical Delivery Photo • Bole Addis Ababa Facility
                </span>
              </div>
            </div>

            {/* Right: Technical Specifications & Verification Info */}
            <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-y-auto max-h-[92vh]">
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] text-[10px] font-bold uppercase tracking-wider">
                    {activeModalWork.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                    {activeModalWork.year} Production
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-1">
                  {activeModalWork.title}
                </h3>
                
                <p className="text-sm font-semibold text-[#8C4B31] mb-4 flex items-center gap-1.5">
                  <Building2 size={15} />
                  <span>{activeModalWork.client}</span>
                  <span className="text-stone-400">•</span>
                  <MapPin size={13} className="text-stone-400" />
                  <span className="text-xs text-stone-500">{activeModalWork.location}</span>
                </p>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6">
                  {activeModalWork.description}
                </p>

                {/* Client Quote / Testimonial if available */}
                {activeModalWork.clientQuote && (
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border-l-4 border-[#8C4B31] text-xs text-stone-700 italic mb-6">
                    &ldquo;{activeModalWork.clientQuote}&rdquo;
                  </div>
                )}

                {/* Specification Grid */}
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-3 flex items-center gap-1.5">
                  <Layers size={14} className="text-[#1E3B2E]" />
                  <span>Physical Manufacturing Specs</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs mb-8">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] block uppercase font-bold">Paper Density</span>
                    <span className="font-bold text-stone-900">{activeModalWork.gsm} GSM Heavy Virgin Kraft</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] block uppercase font-bold">Dimensions</span>
                    <span className="font-bold text-stone-900">{activeModalWork.dimensions}</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] block uppercase font-bold">Handle Architecture</span>
                    <span className="font-bold text-stone-900">{activeModalWork.handleType}</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] block uppercase font-bold">Print & Inks</span>
                    <span className="font-bold text-stone-900">{activeModalWork.printFinish}</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 col-span-2">
                    <span className="text-stone-400 text-[10px] block uppercase font-bold">Completed Batch Size</span>
                    <span className="font-bold text-[#1E3B2E] text-sm">{activeModalWork.batchSize} manufactured & delivered</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href={`/design-submission?preset=${encodeURIComponent(activeModalWork.title)}&gsm=${activeModalWork.gsm}&dimensions=${encodeURIComponent(activeModalWork.dimensions)}`}
                  onClick={closeNiceView}
                  className="w-full sm:w-auto flex-1 bg-[#1E3B2E] hover:bg-[#8C4B31] text-white py-3.5 px-6 rounded-full text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <PenTool size={14} />
                  <span>Customize in Bag Studio</span>
                </Link>

                <button
                  onClick={closeNiceView}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
                >
                  Close View
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}

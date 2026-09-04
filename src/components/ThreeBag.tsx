"use client";

import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Sparkles, RotateCw, Palette, Layers } from "lucide-react";

export interface BagPreset {
  id: string;
  name: string;
  bodyColor: string;
  bodyRoughness: number;
  handleColor: string;
  accentColor: string;
  materialName: string;
  tagline: string;
}

export const BAG_PRESETS: BagPreset[] = [
  {
    id: "kraft",
    name: "Artisan Kraft",
    bodyColor: "#C99B6D",
    bodyRoughness: 0.88,
    handleColor: "#7A4D2E",
    accentColor: "#E0B382",
    materialName: "180 GSM Ethiopian Virgin Kraft",
    tagline: "100% Recycled & Compostable",
  },
  {
    id: "forest",
    name: "Arenguade Forest",
    bodyColor: "#1E3B2E",
    bodyRoughness: 0.75,
    handleColor: "#12251D",
    accentColor: "#D4AF37",
    materialName: "220 GSM Coated Botanical Matte",
    tagline: "Signature Brand Edition",
  },
  {
    id: "terracotta",
    name: "Omo Terracotta",
    bodyColor: "#99472A",
    bodyRoughness: 0.82,
    handleColor: "#612714",
    accentColor: "#E6A882",
    materialName: "200 GSM Unbleached Earth Kraft",
    tagline: "Inspired by Ethiopian Rift Valley",
  },
  {
    id: "obsidian",
    name: "Luxury Obsidian",
    bodyColor: "#222120",
    bodyRoughness: 0.6,
    handleColor: "#D4AF37",
    accentColor: "#E5C158",
    materialName: "250 GSM Matte Soft-Touch + Gold Foil",
    tagline: "VIP Boutique & Jewelry Edition",
  },
];

function RealisticPaperBag({ preset }: { preset: BagPreset }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);

  // Subtle floating sway
  useFrame(() => {
    if (groupRef.current) {
      const t = performance.now() * 0.001;
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.05;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      position={[0, -0.1, 0]}
    >
      {/* Main Bag Body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.2, 2.7, 1.15]} />
        <meshStandardMaterial
          color={preset.bodyColor}
          roughness={preset.bodyRoughness}
          metalness={preset.id === "obsidian" ? 0.15 : 0.04}
        />
      </mesh>

      {/* Top Folded Lip / Reinforced Rim */}
      <mesh castShadow receiveShadow position={[0, 1.34, 0]}>
        <boxGeometry args={[2.24, 0.22, 1.19]} />
        <meshStandardMaterial
          color={preset.bodyColor}
          roughness={preset.bodyRoughness * 0.95}
          metalness={preset.id === "obsidian" ? 0.2 : 0.05}
        />
      </mesh>

      {/* Side Gusset Creases (Authentic paper bag accordion fold effect) */}
      <mesh position={[-1.105, 0, 0]}>
        <boxGeometry args={[0.02, 2.65, 0.35]} />
        <meshStandardMaterial
          color={preset.bodyColor}
          roughness={0.95}
          color-multiplyScalar={0.88}
        />
      </mesh>
      <mesh position={[1.105, 0, 0]}>
        <boxGeometry args={[0.02, 2.65, 0.35]} />
        <meshStandardMaterial
          color={preset.bodyColor}
          roughness={0.95}
          color-multiplyScalar={0.88}
        />
      </mesh>

      {/* Reinforced Bottom Fold */}
      <mesh receiveShadow position={[0, -1.34, 0]}>
        <boxGeometry args={[2.22, 0.05, 1.17]} />
        <meshStandardMaterial
          color={preset.bodyColor}
          roughness={0.92}
        />
      </mesh>

      {/* Front Hot-Stamp Luxury Badge / Brand Emblem */}
      <group position={[0, 0.2, 0.585]}>
        {/* Brand Plaque */}
        <mesh>
          <boxGeometry args={[1.15, 0.75, 0.02]} />
          <meshStandardMaterial
            color={preset.id === "obsidian" ? "#1A1918" : "#F7EFE3"}
            roughness={0.4}
            metalness={preset.id === "obsidian" ? 0.3 : 0.1}
          />
        </mesh>

        {/* Foil Border Accent */}
        <mesh position={[0, 0, 0.015]}>
          <ringGeometry args={[0.42, 0.44, 32]} />
          <meshStandardMaterial
            color={preset.accentColor}
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>

        {/* Center Seedling / Leaf Emblem (Ethiopian Green Growth Icon) */}
        <mesh position={[0, 0.02, 0.02]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.18, 0.18, 0.01]} />
          <meshStandardMaterial
            color={preset.accentColor}
            metalness={0.75}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Handles & Brass Eyelets */}
      {/* Front Eyelets */}
      <mesh position={[-0.55, 1.34, 0.6]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.065, 0.022, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.55, 1.34, 0.6]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.065, 0.022, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Back Eyelets */}
      <mesh position={[-0.55, 1.34, -0.6]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.065, 0.022, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.55, 1.34, -0.6]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.065, 0.022, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Front Twisted Paper Handle */}
      <group position={[0, 1.35, 0.6]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <torusGeometry args={[0.55, 0.052, 16, 36, Math.PI]} />
          <meshStandardMaterial
            color={preset.handleColor}
            roughness={0.92}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* Back Twisted Paper Handle */}
      <group position={[0, 1.35, -0.6]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <torusGeometry args={[0.55, 0.052, 16, 36, Math.PI]} />
          <meshStandardMaterial
            color={preset.handleColor}
            roughness={0.92}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* Hanging Artisan Swing Tag */}
      <group position={[-0.52, 0.85, 0.68]} rotation={[0.08, -0.15, -0.2]}>
        {/* String */}
        <mesh position={[0.03, 0.35, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.6, 8]} />
          <meshStandardMaterial color="#D8C29D" roughness={0.95} />
        </mesh>
        {/* Kraft Tag */}
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.65, 0.015]} />
          <meshStandardMaterial
            color="#EAD7BE"
            roughness={0.85}
          />
        </mesh>
        {/* Eyelet on Tag */}
        <mesh position={[0, 0.24, 0.01]}>
          <circleGeometry args={[0.045, 16]} />
          <meshStandardMaterial color="#9E7745" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

export default function ThreeBagScene() {
  const [selectedPreset, setSelectedPreset] = useState<BagPreset>(BAG_PRESETS[0]);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);

  return (
    <div className="relative w-full h-full min-h-[520px] select-none">
      {/* 3D Canvas with Zero Remote External Dependencies */}
      <div className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing">
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={[1, 2]}
          camera={{ position: [0, 0.6, 5.2], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          {/* Robust Studio Lighting Setup - NO EXTERNAL HDR DOWNLOADS */}
          <ambientLight intensity={0.85} color="#FFF8F0" />
          
          {/* Main Key Light */}
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.5}
            color="#FFFCF7"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0001}
          />

          {/* Soft Fill Light */}
          <directionalLight
            position={[-5, 4, -3]}
            intensity={0.65}
            color="#E0F2FE"
          />

          {/* Back Warm Rim Light */}
          <directionalLight
            position={[0, -2, -5]}
            intensity={0.45}
            color="#FDE68A"
          />

          {/* Front Detail Light */}
          <pointLight position={[0, 2.5, 4]} intensity={0.45} color="#FFFFFF" />

          {/* Realistic Floor Contact Shadow */}
          <ContactShadows
            position={[0, -1.65, 0]}
            opacity={0.6}
            scale={7.5}
            blur={2.4}
            far={3.8}
            color="#382215"
          />

          {/* Smooth Presentation & Orbit Controls */}
          <Suspense fallback={null}>
            <Float
              speed={1.6}
              rotationIntensity={0.25}
              floatIntensity={0.5}
              floatingRange={[-0.08, 0.08]}
            >
              <RealisticPaperBag preset={selectedPreset} />
            </Float>
          </Suspense>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={isAutoRotating}
            autoRotateSpeed={1.6}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 1.85}
            rotateSpeed={0.8}
          />
        </Canvas>
      </div>

      {/* Floating Interactive Controls Bar for Investor Showcase */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto z-10 flex flex-wrap gap-2 items-center">
        <div className="bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200/80 shadow-sm flex items-center gap-2">
          <Palette size={14} className="text-[#8C4B31]" />
          <span className="text-xs font-semibold text-stone-700 tracking-wide">Finish:</span>
          <div className="flex items-center gap-1.5">
            {BAG_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPreset(p)}
                title={`${p.name} - ${p.materialName}`}
                className={`w-5 h-5 rounded-full transition-all transform ${
                  selectedPreset.id === p.id
                    ? "ring-2 ring-[#8C4B31] ring-offset-1 scale-110"
                    : "opacity-75 hover:opacity-100 hover:scale-105"
                }`}
                style={{ backgroundColor: p.bodyColor }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsAutoRotating((prev) => !prev)}
          className="bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200/80 shadow-sm flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 hover:bg-white transition-all"
        >
          <RotateCw size={13} className={isAutoRotating ? "animate-spin text-[#8C4B31]" : "text-stone-400"} />
          <span>{isAutoRotating ? "Auto-Spinning" : "Paused"}</span>
        </button>
      </div>

      {/* Floating Material Spec Pill */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-stone-200/90 shadow-md max-w-xs">
        <div className="flex items-center gap-2 mb-0.5">
          <Layers size={13} className="text-[#2C4A3B]" />
          <p className="text-[11px] font-bold tracking-wider uppercase text-[#2C4A3B]">
            {selectedPreset.name}
          </p>
        </div>
        <p className="text-xs font-medium text-stone-800">{selectedPreset.materialName}</p>
        <p className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1">
          <Sparkles size={10} className="text-[#8C4B31]" /> {selectedPreset.tagline}
        </p>
      </div>
    </div>
  );
}

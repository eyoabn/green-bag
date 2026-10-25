"use client";

import { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// Single canonical Artisan Kraft preset — no color switching
const KRAFT_PRESET = {
  bodyColor: "#C99B6D",
  bodyRoughness: 0.88,
  handleColor: "#7A4D2E",
  accentColor: "#E0B382",
};

function RealisticPaperBag() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group
      ref={groupRef}
      scale={1}
      position={[0, -0.15, 0]}
    >
      {/* Main Bag Body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.2, 2.7, 1.15]} />
        <meshStandardMaterial
          color={KRAFT_PRESET.bodyColor}
          roughness={KRAFT_PRESET.bodyRoughness}
          metalness={0.04}
        />
      </mesh>

      {/* Top Folded Lip / Reinforced Rim */}
      <mesh castShadow receiveShadow position={[0, 1.34, 0]}>
        <boxGeometry args={[2.24, 0.22, 1.19]} />
        <meshStandardMaterial
          color={KRAFT_PRESET.bodyColor}
          roughness={KRAFT_PRESET.bodyRoughness * 0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Side Gusset Creases */}
      <mesh position={[-1.105, 0, 0]}>
        <boxGeometry args={[0.02, 2.65, 0.35]} />
        <meshStandardMaterial
          color={KRAFT_PRESET.bodyColor}
          roughness={0.95}
        />
      </mesh>
      <mesh position={[1.105, 0, 0]}>
        <boxGeometry args={[0.02, 2.65, 0.35]} />
        <meshStandardMaterial
          color={KRAFT_PRESET.bodyColor}
          roughness={0.95}
        />
      </mesh>

      {/* Reinforced Bottom Fold */}
      <mesh receiveShadow position={[0, -1.34, 0]}>
        <boxGeometry args={[2.22, 0.05, 1.17]} />
        <meshStandardMaterial
          color={KRAFT_PRESET.bodyColor}
          roughness={0.92}
        />
      </mesh>

      {/* Front Hot-Stamp Brand Plaque */}
      <group position={[0, 0.2, 0.585]}>
        <mesh>
          <boxGeometry args={[1.15, 0.75, 0.02]} />
          <meshStandardMaterial
            color="#F7EFE3"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>

        {/* Foil Border Accent */}
        <mesh position={[0, 0, 0.015]}>
          <ringGeometry args={[0.42, 0.44, 32]} />
          <meshStandardMaterial
            color={KRAFT_PRESET.accentColor}
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>

        {/* Center Leaf Emblem */}
        <mesh position={[0, 0.02, 0.02]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.18, 0.18, 0.01]} />
          <meshStandardMaterial
            color={KRAFT_PRESET.accentColor}
            metalness={0.75}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Front Brass Eyelets */}
      <mesh position={[-0.55, 1.34, 0.6]}>
        <torusGeometry args={[0.065, 0.022, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.55, 1.34, 0.6]}>
        <torusGeometry args={[0.065, 0.022, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Back Brass Eyelets */}
      <mesh position={[-0.55, 1.34, -0.6]}>
        <torusGeometry args={[0.065, 0.022, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.55, 1.34, -0.6]}>
        <torusGeometry args={[0.065, 0.022, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Front Twisted Paper Handle */}
      <group position={[0, 1.35, 0.6]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <torusGeometry args={[0.55, 0.052, 16, 36, Math.PI]} />
          <meshStandardMaterial
            color={KRAFT_PRESET.handleColor}
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
            color={KRAFT_PRESET.handleColor}
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
          <meshStandardMaterial color="#EAD7BE" roughness={0.85} />
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
  return (
    <div className="relative w-full h-full min-h-[420px] select-none cursor-grab active:cursor-grabbing">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 2]}
        camera={{ position: [0, 0.5, 4.8], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Studio Lighting — no external HDR */}
        <ambientLight intensity={0.9} color="#FFF8F0" />

        {/* Main Key Light */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.6}
          color="#FFFCF7"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />

        {/* Soft Fill Light */}
        <directionalLight
          position={[-5, 4, -3]}
          intensity={0.7}
          color="#E0F2FE"
        />

        {/* Warm Rim Light */}
        <directionalLight
          position={[0, -2, -5]}
          intensity={0.5}
          color="#FDE68A"
        />

        {/* Front Detail */}
        <pointLight position={[0, 2.5, 4]} intensity={0.5} color="#FFFFFF" />

        {/* Floor Contact Shadow */}
        <ContactShadows
          position={[0, -1.65, 0]}
          opacity={0.55}
          scale={7}
          blur={2.2}
          far={3.5}
          color="#382215"
        />

        <Suspense fallback={null}>
          <RealisticPaperBag />
        </Suspense>

        {/* Orbit Controls — slow auto rotation, user can drag to inspect */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.4}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.85}
          rotateSpeed={0.6}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Minimal overlay label */}
      <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-semibold text-stone-600 border border-stone-200/80 pointer-events-none shadow-xs">
        360° · Drag to Inspect
      </div>
    </div>
  );
}

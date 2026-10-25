"use client";

import { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// Fixed authentic Ethiopian Artisan Kraft Palette — No color switching
const KRAFT_PRESET = {
  bodyColor: "#C99B6D",
  bodyRoughness: 0.85,
  handleColor: "#6B4423",
  accentColor: "#E0B382",
  creaseColor: "#B58455",
};

function RealisticPaperBag() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group
      ref={groupRef}
      scale={0.90}
      position={[0, -0.05, 0]}
    >
      {/* Main Bag Body - Slimmer, realistic shopping bag proportions */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.1, 2.65, 0.95]} />
        <meshStandardMaterial
          color={KRAFT_PRESET.bodyColor}
          roughness={KRAFT_PRESET.bodyRoughness}
          metalness={0.03}
        />
      </mesh>

      {/* Top Folded Rim (Turn-top hem) */}
      <mesh castShadow receiveShadow position={[0, 1.32, 0]}>
        <boxGeometry args={[2.14, 0.18, 0.99]} />
        <meshStandardMaterial
          color={KRAFT_PRESET.bodyColor}
          roughness={KRAFT_PRESET.bodyRoughness * 0.95}
          metalness={0.04}
        />
      </mesh>

      {/* Side Gusset Inward Creases (Left and Right) */}
      <mesh position={[-1.055, 0, 0]}>
        <boxGeometry args={[0.015, 2.6, 0.28]} />
        <meshStandardMaterial
          color={KRAFT_PRESET.creaseColor}
          roughness={0.92}
        />
      </mesh>
      <mesh position={[1.055, 0, 0]}>
        <boxGeometry args={[0.015, 2.6, 0.28]} />
        <meshStandardMaterial
          color={KRAFT_PRESET.creaseColor}
          roughness={0.92}
        />
      </mesh>

      {/* Reinforced Bottom Fold */}
      <mesh receiveShadow position={[0, -1.32, 0]}>
        <boxGeometry args={[2.12, 0.04, 0.97]} />
        <meshStandardMaterial
          color={KRAFT_PRESET.creaseColor}
          roughness={0.92}
        />
      </mesh>

      {/* Front Hot-Stamp Artisan Plaque / Brand Mark */}
      <group position={[0, 0.15, 0.485]}>
        <mesh>
          <boxGeometry args={[1.05, 0.7, 0.015]} />
          <meshStandardMaterial
            color="#FAF4EB"
            roughness={0.35}
            metalness={0.05}
          />
        </mesh>

        {/* Delicate Gold/Copper Foil Border Accent */}
        <mesh position={[0, 0, 0.012]}>
          <ringGeometry args={[0.38, 0.4, 32]} />
          <meshStandardMaterial
            color={KRAFT_PRESET.accentColor}
            metalness={0.75}
            roughness={0.25}
          />
        </mesh>

        {/* Center Ge'ez Leaf / Diamond Icon */}
        <mesh position={[0, 0.02, 0.015]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.16, 0.16, 0.01]} />
          <meshStandardMaterial
            color={KRAFT_PRESET.accentColor}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Front Brass Eyelets */}
      <mesh position={[-0.52, 1.32, 0.5]}>
        <torusGeometry args={[0.058, 0.02, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.52, 1.32, 0.5]}>
        <torusGeometry args={[0.058, 0.02, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Back Brass Eyelets */}
      <mesh position={[-0.52, 1.32, -0.5]}>
        <torusGeometry args={[0.058, 0.02, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.52, 1.32, -0.5]}>
        <torusGeometry args={[0.058, 0.02, 16, 24]} />
        <meshStandardMaterial color="#C5A059" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Front Twisted Paper Handle */}
      <group position={[0, 1.33, 0.5]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <torusGeometry args={[0.52, 0.048, 16, 36, Math.PI]} />
          <meshStandardMaterial
            color={KRAFT_PRESET.handleColor}
            roughness={0.92}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* Back Twisted Paper Handle */}
      <group position={[0, 1.33, -0.5]}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <torusGeometry args={[0.52, 0.048, 16, 36, Math.PI]} />
          <meshStandardMaterial
            color={KRAFT_PRESET.handleColor}
            roughness={0.92}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* Subtle Hanging Artisan Tag */}
      <group position={[-0.5, 0.82, 0.56]} rotation={[0.06, -0.12, -0.18]}>
        <mesh position={[0.02, 0.3, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.55, 8]} />
          <meshStandardMaterial color="#D8C29D" roughness={0.95} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.58, 0.012]} />
          <meshStandardMaterial color="#EAD7BE" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.22, 0.008]}>
          <circleGeometry args={[0.04, 16]} />
          <meshStandardMaterial color="#9E7745" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

export default function ThreeBagScene() {
  return (
    <div className="relative w-full h-full min-h-[420px] select-none cursor-grab active:cursor-grabbing flex items-center justify-center">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 2]}
        camera={{ position: [0, 0.1, 5.0], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Warm Studio Lighting */}
        <ambientLight intensity={0.95} color="#FFF8F0" />

        <directionalLight
          position={[5, 7, 5]}
          intensity={1.5}
          color="#FFFCF7"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />

        <directionalLight
          position={[-5, 3, -3]}
          intensity={0.65}
          color="#E0F2FE"
        />

        <directionalLight
          position={[0, -2, -5]}
          intensity={0.45}
          color="#FDE68A"
        />

        <pointLight position={[0, 2.5, 3.8]} intensity={0.45} color="#FFFFFF" />

        {/* Floor Contact Shadow */}
        <ContactShadows
          position={[0, -1.6, 0]}
          opacity={0.5}
          scale={6.5}
          blur={2.0}
          far={3.2}
          color="#382215"
        />

        <Suspense fallback={null}>
          <RealisticPaperBag />
        </Suspense>

        {/* Orbit Controls — No auto-spinning; gentle, slow drag inspection */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.85}
          rotateSpeed={0.35}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Clean, discreet badge */}
      <div className="absolute bottom-3 right-3 bg-white/85 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-semibold text-stone-600 border border-stone-200/80 pointer-events-none shadow-xs">
        360° · Drag to Inspect
      </div>
    </div>
  );
}

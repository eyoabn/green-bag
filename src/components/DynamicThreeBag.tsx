"use client";

import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Float, OrbitControls, ContactShadows, Text } from "@react-three/drei";
import * as THREE from "three";
import { RotateCw } from "lucide-react";

export interface DynamicBagProps {
  bagColor: string;
  handleColor: string;
  textColor: string;
  brandTitle: string;
  brandSubtitle: string;
  fontFamily: "serif" | "sans" | "display" | "ethiopic";
  emblemType: "coffee" | "crown" | "leaf" | "star" | "none" | "custom";
  customLogoUrl: string | null;
  handleType: string;
}

// Custom Logo Component loads the texture
function CustomLogo({ url, color }: { url: string; color: string }) {
  const texture = useLoader(THREE.TextureLoader, url);
  return (
    <mesh position={[0, 0.25, 0.02]} rotation={[0, 0, 0]}>
      <planeGeometry args={[0.3, 0.3]} />
      <meshStandardMaterial map={texture} transparent alphaTest={0.1} color={color} />
    </mesh>
  );
}

function RealisticDynamicBag({ props }: { props: DynamicBagProps }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);

  // Subtle floating sway
  useFrame(() => {
    if (groupRef.current) {
      const t = performance.now() * 0.001;
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.05;
    }
  });

  // Map the font family
  const fontUrl = props.fontFamily === "sans" 
    ? "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
    : props.fontFamily === "display"
    ? "https://fonts.gstatic.com/s/oswald/v49/TK3_WkUHHAIjg75cFRf3bXL8LICs1_FvsUtiZTaR.woff2"
    : "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2"; // Serif / default

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
          color={props.bagColor}
          roughness={0.88}
        />
      </mesh>

      {/* Top Folded Lip */}
      <mesh castShadow receiveShadow position={[0, 1.34, 0]}>
        <boxGeometry args={[2.24, 0.22, 1.19]} />
        <meshStandardMaterial
          color={props.bagColor}
          roughness={0.84}
        />
      </mesh>

      {/* Side Gusset Creases */}
      <mesh position={[-1.105, 0, 0]}>
        <boxGeometry args={[0.02, 2.65, 0.35]} />
        <meshStandardMaterial color={props.bagColor} roughness={0.95} color-multiplyScalar={0.88} />
      </mesh>
      <mesh position={[1.105, 0, 0]}>
        <boxGeometry args={[0.02, 2.65, 0.35]} />
        <meshStandardMaterial color={props.bagColor} roughness={0.95} color-multiplyScalar={0.88} />
      </mesh>

      {/* Front Brand Group */}
      <group position={[0, 0, 0.585]}>
        {/* Emblem */}
        {props.emblemType === "custom" && props.customLogoUrl ? (
          <Suspense fallback={null}>
             <CustomLogo url={props.customLogoUrl} color={props.textColor} />
          </Suspense>
        ) : props.emblemType !== "none" ? (
          <group position={[0, 0.25, 0.02]}>
            {/* Simple shape representation for the icons */}
            {props.emblemType === "coffee" && (
               <mesh>
                 <cylinderGeometry args={[0.1, 0.15, 0.2, 16]} />
                 <meshStandardMaterial color={props.textColor} />
               </mesh>
            )}
            {props.emblemType === "crown" && (
               <mesh rotation={[Math.PI/2, 0, 0]}>
                 <torusGeometry args={[0.12, 0.04, 8, 3]} />
                 <meshStandardMaterial color={props.textColor} />
               </mesh>
            )}
            {props.emblemType === "leaf" && (
               <mesh rotation={[0, 0, Math.PI/4]}>
                 <boxGeometry args={[0.15, 0.15, 0.02]} />
                 <meshStandardMaterial color={props.textColor} />
               </mesh>
            )}
            {props.emblemType === "star" && (
               <mesh>
                 <octahedronGeometry args={[0.15, 0]} />
                 <meshStandardMaterial color={props.textColor} />
               </mesh>
            )}
          </group>
        ) : null}

        {/* Text Rendering */}
        <Text
          position={[0, -0.2, 0.02]}
          fontSize={0.2}
          font={fontUrl}
          color={props.textColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={1.8}
          textAlign="center"
        >
          {props.brandTitle}
        </Text>
        
        {props.brandSubtitle && (
          <Text
            position={[0, -0.45, 0.02]}
            fontSize={0.08}
            font={fontUrl}
            color={props.textColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={1.8}
            textAlign="center"
            letterSpacing={0.1}
          >
            {props.brandSubtitle.toUpperCase()}
          </Text>
        )}
      </group>

      {/* Handles */}
      {props.handleType !== "diecut" && (
        <group>
          {/* Front Twisted Paper Handle */}
          <group position={[0, 1.35, 0.6]}>
            <mesh castShadow rotation={[Math.PI, 0, 0]}>
              <torusGeometry args={[0.55, 0.052, 16, 36, Math.PI]} />
              <meshStandardMaterial
                color={props.handleColor}
                roughness={0.92}
              />
            </mesh>
          </group>
          {/* Back Twisted Paper Handle */}
          <group position={[0, 1.35, -0.6]}>
            <mesh castShadow rotation={[Math.PI, 0, 0]}>
              <torusGeometry args={[0.55, 0.052, 16, 36, Math.PI]} />
              <meshStandardMaterial
                color={props.handleColor}
                roughness={0.92}
              />
            </mesh>
          </group>
        </group>
      )}

      {props.handleType === "diecut" && (
        // Visualize the cut by drawing a dark hole (simple approximation)
        <group position={[0, 1.1, 0.585]}>
           <mesh>
             <boxGeometry args={[0.8, 0.2, 0.02]} />
             <meshBasicMaterial color="#1a1a1a" />
           </mesh>
        </group>
      )}

    </group>
  );
}

export default function DynamicThreeBagScene({ bagProps }: { bagProps: DynamicBagProps }) {
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);

  return (
    <div className="relative w-full h-full min-h-[520px] select-none">
      <div className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing">
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={[1, 2]}
          camera={{ position: [0, 0.6, 5.2], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={0.85} color="#FFF8F0" />
          <directionalLight position={[5, 8, 5]} intensity={1.5} color="#FFFCF7" castShadow />
          <directionalLight position={[-5, 4, -3]} intensity={0.65} color="#E0F2FE" />
          <ContactShadows position={[0, -1.65, 0]} opacity={0.6} scale={7.5} blur={2.4} far={3.8} color="#382215" />

          <Suspense fallback={null}>
            <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.5}>
              <RealisticDynamicBag props={bagProps} />
            </Float>
          </Suspense>

          <OrbitControls
            enableZoom={true}
            enablePan={false}
            autoRotate={isAutoRotating}
            autoRotateSpeed={1.6}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 1.85}
          />
        </Canvas>
      </div>

      <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
        <button
          onClick={() => setIsAutoRotating((prev) => !prev)}
          className="bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200/80 shadow-sm flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-all"
        >
          <RotateCw size={13} className={isAutoRotating ? "animate-spin text-[#8C4B31]" : "text-stone-400"} />
          <span>{isAutoRotating ? "Auto-Spinning" : "Paused"}</span>
        </button>
      </div>
    </div>
  );
}

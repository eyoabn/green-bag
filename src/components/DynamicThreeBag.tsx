"use client";

import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, ContactShadows, Text } from "@react-three/drei";
import * as THREE from "three";
import { RotateCw, Play, Pause } from "lucide-react";

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
  autoRotate?: boolean;
  onToggleAutoRotate?: () => void;
}

// Custom Uploaded Brand Logo Component
function CustomLogoMesh({ url }: { url: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.warn("Could not load custom logo texture:", err);
      }
    );
  }, [url]);

  if (!texture) return null;

  return (
    <mesh position={[0, 0.35, 0.02]}>
      <planeGeometry args={[0.85, 0.85]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.05} toneMapped={false} />
    </mesh>
  );
}

// Procedural High-Resolution Ethiopian Emblems (Jebena, Crown, Leaf, Tibeb Star)
function ProceduralEmblemMesh({ type, color }: { type: string; color: string }) {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (type === "coffee") {
      // Authentic Ethiopian Clay Jebena (Coffee Pot)
      ctx.save();
      ctx.translate(256, 260);

      // Round clay pot body
      ctx.beginPath();
      ctx.arc(0, 50, 95, 0, Math.PI * 2);
      ctx.fill();

      // Slender flared neck
      ctx.beginPath();
      ctx.moveTo(-32, 50);
      ctx.quadraticCurveTo(-22, -60, -38, -120);
      ctx.lineTo(38, -120);
      ctx.quadraticCurveTo(22, -60, 32, 50);
      ctx.closePath();
      ctx.fill();

      // Top lip & finial lid
      ctx.beginPath();
      ctx.ellipse(0, -120, 48, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -145, 14, 0, Math.PI * 2);
      ctx.fill();

      // Pouring spout
      ctx.beginPath();
      ctx.moveTo(-75, 30);
      ctx.quadraticCurveTo(-155, -20, -135, -95);
      ctx.lineTo(-118, -92);
      ctx.quadraticCurveTo(-135, -15, -60, 55);
      ctx.closePath();
      ctx.fill();

      // Looped handle
      ctx.beginPath();
      ctx.lineWidth = 22;
      ctx.moveTo(35, -70);
      ctx.bezierCurveTo(145, -70, 145, 60, 75, 80);
      ctx.stroke();

      // Steam wisps rising
      ctx.beginPath();
      ctx.lineWidth = 8;
      ctx.moveTo(-18, -170);
      ctx.quadraticCurveTo(-32, -195, -18, -220);
      ctx.moveTo(12, -175);
      ctx.quadraticCurveTo(26, -200, 12, -225);
      ctx.stroke();

      ctx.restore();
    } else if (type === "crown") {
      // Imperial Ethiopian Crown Crest
      ctx.save();
      ctx.translate(256, 260);

      // Base royal headband
      ctx.beginPath();
      ctx.roundRect(-145, 65, 290, 36, 10);
      ctx.fill();

      // Headband cutouts
      ctx.fillStyle = "#ffffff";
      for (let i = -100; i <= 100; i += 50) {
        ctx.beginPath();
        ctx.arc(i, 83, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = color;
      // 5 Crown Points
      ctx.beginPath();
      ctx.moveTo(-135, 65);
      ctx.lineTo(-130, -30);
      ctx.lineTo(-75, 25);
      ctx.lineTo(-45, -75);
      ctx.lineTo(0, 20);
      ctx.lineTo(0, -120); // Central tall spire
      ctx.lineTo(0, 20);
      ctx.lineTo(45, -75);
      ctx.lineTo(75, 25);
      ctx.lineTo(130, -30);
      ctx.lineTo(135, 65);
      ctx.closePath();
      ctx.fill();

      // Pearls on spires
      ctx.beginPath();
      ctx.arc(-130, -42, 14, 0, Math.PI * 2);
      ctx.arc(-45, -87, 15, 0, Math.PI * 2);
      ctx.arc(0, -135, 18, 0, Math.PI * 2);
      ctx.arc(45, -87, 15, 0, Math.PI * 2);
      ctx.arc(130, -42, 14, 0, Math.PI * 2);
      ctx.fill();

      // Ethiopian Cross at crown top
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(0, -155);
      ctx.lineTo(0, -205);
      ctx.moveTo(-20, -180);
      ctx.lineTo(20, -180);
      ctx.stroke();

      ctx.restore();
    } else if (type === "leaf") {
      // Botanical Coffee Branch & Ripe Cherries
      ctx.save();
      ctx.translate(256, 256);

      // Stem
      ctx.beginPath();
      ctx.lineWidth = 14;
      ctx.moveTo(0, 150);
      ctx.quadraticCurveTo(15, 0, 0, -150);
      ctx.stroke();

      // Left Leaf
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.bezierCurveTo(-160, 40, -180, -90, -30, -90);
      ctx.bezierCurveTo(-5, -60, 0, -20, 0, 20);
      ctx.fill();

      // Right Leaf
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.bezierCurveTo(160, -10, 180, -140, 30, -140);
      ctx.bezierCurveTo(5, -110, 0, -70, 0, -30);
      ctx.fill();

      // Coffee Berries Cluster
      ctx.beginPath();
      ctx.arc(-15, 45, 20, 0, Math.PI * 2);
      ctx.arc(20, 35, 22, 0, Math.PI * 2);
      ctx.arc(5, 70, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else if (type === "star") {
      // Traditional Ethiopian 8-pointed Tibeb Star Cross
      ctx.save();
      ctx.translate(256, 256);

      // 8-Pointed Star
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI) / 8;
        const radius = i % 2 === 0 ? 150 : 65;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Internal geometric medallion cutout
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [type, color]);

  if (!texture) return null;

  return (
    <mesh position={[0, 0.35, 0.02]}>
      <planeGeometry args={[0.75, 0.75]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.05} toneMapped={false} />
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

  return (
    <group
      ref={groupRef}
      scale={hovered ? 1.02 : 1}
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
        {/* Emblem or Custom Logo */}
        {props.emblemType === "custom" && props.customLogoUrl ? (
          <Suspense fallback={null}>
            <CustomLogoMesh url={props.customLogoUrl} />
          </Suspense>
        ) : props.emblemType !== "none" ? (
          <ProceduralEmblemMesh type={props.emblemType} color={props.textColor} />
        ) : null}

        {/* Brand Headline Text */}
        <Text
          position={[0, -0.22, 0.02]}
          fontSize={0.2}
          color={props.textColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={1.8}
          textAlign="center"
        >
          {props.brandTitle}
        </Text>
        
        {/* Tagline / Subtitle Text */}
        {props.brandSubtitle && (
          <Text
            position={[0, -0.48, 0.02]}
            fontSize={0.08}
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
          {/* Front Handle */}
          <group position={[0, 1.35, 0.6]}>
            <mesh castShadow rotation={[Math.PI, 0, 0]}>
              <torusGeometry args={[0.55, 0.052, 16, 36, Math.PI]} />
              <meshStandardMaterial
                color={props.handleColor}
                roughness={0.92}
              />
            </mesh>
          </group>
          {/* Back Handle */}
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
  const [internalAutoRotate, setInternalAutoRotate] = useState<boolean>(true);
  const isRotating = bagProps.autoRotate !== undefined ? bagProps.autoRotate : internalAutoRotate;

  const handleToggle = () => {
    if (bagProps.onToggleAutoRotate) {
      bagProps.onToggleAutoRotate();
    } else {
      setInternalAutoRotate((prev) => !prev);
    }
  };

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
            <Float speed={isRotating ? 1.6 : 0} rotationIntensity={isRotating ? 0.25 : 0} floatIntensity={isRotating ? 0.5 : 0}>
              <RealisticDynamicBag props={bagProps} />
            </Float>
          </Suspense>

          <OrbitControls
            enableZoom={true}
            enablePan={false}
            autoRotate={isRotating}
            autoRotateSpeed={1.6}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 1.85}
          />
        </Canvas>
      </div>

      {/* Prominent Floating Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
        <button
          type="button"
          onClick={handleToggle}
          className={`backdrop-blur-md px-3.5 py-1.5 rounded-full border shadow-sm flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
            isRotating 
              ? "bg-white/90 border-stone-200 text-stone-700 hover:text-stone-900" 
              : "bg-[#1E3B2E] border-[#1E3B2E] text-white shadow-md"
          }`}
          title={isRotating ? "Click to Pause 3D Spin" : "Click to Resume 3D Auto-Spin"}
        >
          {isRotating ? (
            <>
              <Pause size={14} className="text-[#8C4B31]" />
              <span>Pause Spin</span>
            </>
          ) : (
            <>
              <Play size={14} className="text-white fill-white" />
              <span>Resume Spin</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

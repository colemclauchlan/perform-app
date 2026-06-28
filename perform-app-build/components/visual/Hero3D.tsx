"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Icosahedron, MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

/**
 * The actual WebGL scene. Loaded only via next/dynamic({ ssr: false }) from
 * HeroBackdrop, so three.js never enters the SSR path or the shared app bundle.
 * Kept deliberately light: one distorted core, a wireframe shell, a sparkle
 * field. No postprocessing — glow comes from emissive + lights.
 */
function Core() {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.1;
    ref.current.rotation.y += dt * 0.14;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.5} floatIntensity={1.1}>
      <Icosahedron ref={ref} args={[1.45, 1]}>
        <MeshDistortMaterial
          color="#2f5cff"
          emissive="#16317f"
          emissiveIntensity={0.55}
          roughness={0.22}
          metalness={0.65}
          distort={0.34}
          speed={1.3}
        />
      </Icosahedron>
      {/* Violet wireframe shell */}
      <Icosahedron args={[1.85, 1]}>
        <meshBasicMaterial color="#8b6bff" wireframe transparent opacity={0.16} />
      </Icosahedron>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.55} />
      <pointLight position={[4, 3, 5]} intensity={2.2} color="#7aa2ff" />
      <pointLight position={[-5, -2, 2]} intensity={1.5} color="#189bf5" />
      <Core />
      <Sparkles count={64} scale={[11, 6, 4]} size={2.1} speed={0.35} color="#3aa6f7" opacity={0.7} />
    </Canvas>
  );
}

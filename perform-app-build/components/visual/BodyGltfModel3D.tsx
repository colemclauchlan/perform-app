"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Bounds } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";

/**
 * Body viewer for the measurements page. Loads a real human GLB from
 * /public/models/body.glb (swap that file to change the body — the model is
 * auto-centered/scaled and the measurement callouts anchor to it by body
 * fraction, so any humanoid mesh works without code changes).
 *
 * The bundled placeholder is a CC0 model. Drop in a realistic CC0/CC-BY body
 * (e.g. a MakeHuman export or a Sketchfab download) at the same path to upgrade.
 */

const MODEL_URL = "/models/body.glb";
useGLTF.preload(MODEL_URL);

export type MeasurePoint = {
  id: string;
  label: string;
  value: number;
  unit: string;
  delta: number | null;
};

// Anchor each callout by body fraction (works regardless of the GLB's scale):
//   y = 0 feet … 1 head;  x = -1 left edge … +1 right edge (of the body width)
const ANCHORS: Record<string, { y: number; x: number; side: "l" | "r" | "c" }> = {
  neck: { y: 0.83, x: 0, side: "c" },
  chest: { y: 0.72, x: 0, side: "c" },
  leftArm: { y: 0.64, x: -0.85, side: "l" },
  rightArm: { y: 0.64, x: 0.85, side: "r" },
  waist: { y: 0.6, x: 0, side: "c" },
  hips: { y: 0.53, x: 0, side: "c" },
  leftThigh: { y: 0.42, x: -0.32, side: "l" },
  rightThigh: { y: 0.42, x: 0.32, side: "r" },
  leftCalf: { y: 0.22, x: -0.38, side: "l" },
  rightCalf: { y: 0.22, x: 0.38, side: "r" },
};

function Callout({ point, pos, side }: { point: MeasurePoint; pos: THREE.Vector3; side: "l" | "r" | "c" }) {
  const up = point.delta != null && point.delta > 0;
  const down = point.delta != null && point.delta < 0;
  const deltaCls = up ? "text-status-green" : down ? "text-text-1" : "text-text-3";
  const justify = side === "l" ? "flex-end" : "flex-start";
  return (
    <>
      <mesh position={pos}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color="#2563eb" toneMapped={false} />
      </mesh>
      <Html position={pos} center zIndexRange={[20, 0]} style={{ pointerEvents: "none", width: 170, display: "flex", justifyContent: justify }}>
        <div
          className="rounded-lg border border-white/12 bg-bg-1/85 backdrop-blur-sm px-2 py-1 leading-tight shadow-lg"
          style={{ transform: side === "l" ? "translateX(-14px)" : side === "r" ? "translateX(14px)" : "none" }}
        >
          <div className="text-[10px] uppercase tracking-wide text-text-3">{point.label}</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[13px] font-semibold text-text-1 tabular-nums">
              {point.value}
              <span className="text-text-3 font-normal text-[10px] ml-0.5">{point.unit}</span>
            </span>
            {point.delta != null && point.delta !== 0 && (
              <span className={`text-[10px] tabular-nums ${deltaCls}`}>
                {point.delta > 0 ? "+" : ""}
                {point.delta}
              </span>
            )}
          </div>
        </div>
      </Html>
    </>
  );
}

function Body({ points }: { points: MeasurePoint[] }) {
  const { scene } = useGLTF(MODEL_URL);

  // Clone + re-skin to a neutral clay so any GLB reads as a clean anatomy figure.
  const model = useMemo(() => {
    const s = scene.clone(true);
    const clay = new THREE.MeshStandardMaterial({ color: "#aeb7c9", roughness: 0.55, metalness: 0.05 });
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.material = clay;
    });
    return s;
  }, [scene]);

  // Auto-center + scale to a fixed display height; derive callout anchor frame.
  const { transform, anchorWorld } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const H = 1.7;
    const scale = H / (size.y || 1);
    const halfW = (size.x * scale) / 2;
    const halfD = (size.z * scale) / 2;
    const bottom = -H / 2;
    return {
      transform: {
        scale,
        position: [-center.x * scale, -center.y * scale, -center.z * scale] as [number, number, number],
      },
      anchorWorld: (a: { x: number; y: number }) =>
        new THREE.Vector3(a.x * halfW, bottom + a.y * H, halfD + 0.05),
    };
  }, [model]);

  return (
    <>
      <group scale={transform.scale} position={transform.position}>
        <primitive object={model} />
      </group>
      {points.map((p) => {
        const a = ANCHORS[p.id];
        if (!a) return null;
        return <Callout key={p.id} point={p} pos={anchorWorld(a)} side={a.side} />;
      })}
    </>
  );
}

export default function BodyGltfModel3D({ points = [], autoRotate = false }: { points?: MeasurePoint[]; autoRotate?: boolean }) {
  return (
    <Canvas dpr={[1, 1.8]} camera={{ position: [0.4, 0.1, 5.2], fov: 30 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
      <ambientLight intensity={0.75} color="#46506a" />
      <hemisphereLight intensity={0.3} groundColor="#0b0f17" />
      <directionalLight position={[3, 5, 4]} intensity={2.3} />
      <directionalLight position={[-4, 2, -3]} intensity={1.5} color="#6f8cff" />
      <directionalLight position={[-2, -1.5, 3]} intensity={0.45} color="#ff9d6f" />
      <Suspense fallback={null}>
        {/* Auto-fit the body to the viewport (robust to any model's scale) */}
        <Bounds fit clip observe margin={1.15}>
          <Body points={points} />
        </Bounds>
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        minDistance={1.5}
        maxDistance={16}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 1.5}
      />
    </Canvas>
  );
}

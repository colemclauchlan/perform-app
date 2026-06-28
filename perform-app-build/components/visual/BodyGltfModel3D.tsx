"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Bounds, Billboard } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Body viewer for the measurements page. Loads a real human GLB from
 * /public/models/body.glb (swap that file to change the body — it's auto-centered
 * /scaled and any humanoid mesh works without code changes).
 *
 * Each tracked measurement is a small dot raycast onto the actual mesh surface
 * at the matching body region. Readouts are hidden by default: hover a dot to
 * reveal its value (one at a time), or tap/click to pin it (multiple allowed).
 */

// Bump the ?v query whenever body.glb changes so browsers/CDN don't serve stale.
const MODEL_URL = "/models/body.glb?v=3";
useGLTF.preload(MODEL_URL);

export type MeasurePoint = {
  id: string;
  label: string;
  value: number;
  unit: string;
  delta: number | null;
};

// Where to drop each dot, as a body fraction: y = 0 feet … 1 head, x = -1 left
// edge … +1 right edge. A ray from the front finds the real surface point.
const ANCHORS: Record<string, { y: number; x: number }> = {
  neck: { y: 0.83, x: 0 },
  chest: { y: 0.72, x: 0 },
  leftArm: { y: 0.66, x: -0.62 },
  rightArm: { y: 0.66, x: 0.62 },
  waist: { y: 0.6, x: 0 },
  hips: { y: 0.53, x: 0 },
  leftThigh: { y: 0.42, x: -0.3 },
  rightThigh: { y: 0.42, x: 0.3 },
  leftCalf: { y: 0.22, x: -0.34 },
  rightCalf: { y: 0.22, x: 0.34 },
};

// Modern measurement marker: a camera-facing target node (glow + ring + center),
// bigger and clearer than a plain dot, with an invisible larger hit area.
function Marker({ active, onOver, onOut, onClick }: { active: boolean; onOver: () => void; onOut: () => void; onClick: () => void }) {
  const r = active ? 0.036 : 0.028;
  const col = active ? "#9ecbff" : "#3aa6f7";
  return (
    <Billboard>
      <mesh>
        <circleGeometry args={[r * 1.35, 28]} />
        <meshBasicMaterial color={col} transparent opacity={0.16} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <ringGeometry args={[r * 0.58, r, 32]} />
        <meshBasicMaterial color={col} transparent opacity={0.96} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[r * 0.3, 18]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh
        position={[0, 0, 0.003]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onOver();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onOut();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <circleGeometry args={[r * 1.6, 18]} />
        <meshBasicMaterial transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </Billboard>
  );
}

// Readout card — click it (or the marker) to close.
function Readout({ point, onClose }: { point: MeasurePoint; onClose: () => void }) {
  const up = point.delta != null && point.delta > 0;
  const down = point.delta != null && point.delta < 0;
  return (
    <Html center zIndexRange={[40, 0]} position={[0, 0.09, 0]} style={{ pointerEvents: "auto" }}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Click to close"
        className="cursor-pointer rounded-lg border border-white/15 bg-bg-1/90 backdrop-blur-sm pl-2 pr-5 py-1 leading-tight shadow-lg whitespace-nowrap animate-scale-in relative select-none"
      >
        <span className="absolute top-0.5 right-1.5 text-text-3 text-[11px] leading-none hover:text-text-1">×</span>
        <div className="text-[10px] uppercase tracking-wide text-text-3">{point.label}</div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-semibold text-text-1 tabular-nums">
            {point.value}
            <span className="text-text-3 font-normal text-[10px] ml-0.5">{point.unit}</span>
          </span>
          {point.delta != null && point.delta !== 0 && (
            <span className={`text-[10px] tabular-nums ${up ? "text-status-green" : down ? "text-text-1" : "text-text-3"}`}>
              {point.delta > 0 ? "+" : ""}
              {point.delta}
            </span>
          )}
        </div>
      </div>
    </Html>
  );
}

function Body({ points }: { points: MeasurePoint[] }) {
  const { scene } = useGLTF(MODEL_URL);

  // Clone + clay finish; compute normals when missing (OBJ→GLB often drops them).
  const model = useMemo(() => {
    const s = scene.clone(true);
    const clay = new THREE.MeshStandardMaterial({ color: "#b9c2d4", roughness: 0.6, metalness: 0.04, side: THREE.DoubleSide });
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        if (m.geometry && !m.geometry.getAttribute("normal")) m.geometry.computeVertexNormals();
        m.material = clay;
      }
    });
    return s;
  }, [scene]);

  // Auto-center + scale to a fixed display height.
  const frame = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const H = 1.7;
    const scale = H / (size.y || 1);
    return {
      scale,
      position: [-center.x * scale, -center.y * scale, -center.z * scale] as [number, number, number],
      halfW: (size.x * scale) / 2,
      halfD: (size.z * scale) / 2,
      H,
      bottom: -H / 2,
    };
  }, [model]);

  const groupRef = useRef<THREE.Group>(null);
  const [surface, setSurface] = useState<Record<string, [number, number, number]>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<Set<string>>(() => new Set());

  // Raycast each anchor from the front onto the real mesh surface.
  const ids = points.map((p) => p.id).join(",");
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.updateWorldMatrix(true, true);
    const ray = new THREE.Raycaster();
    const res: Record<string, [number, number, number]> = {};
    for (const p of points) {
      const a = ANCHORS[p.id];
      if (!a) continue;
      const wx = a.x * frame.halfW;
      const wy = frame.bottom + a.y * frame.H;
      ray.set(new THREE.Vector3(wx, wy, 4), new THREE.Vector3(0, 0, -1));
      const hits = ray.intersectObject(g, true);
      res[p.id] = hits.length ? [hits[0].point.x, hits[0].point.y, hits[0].point.z + 0.012] : [wx, wy, frame.halfD + 0.012];
    }
    setSurface(res);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, frame, ids]);

  function togglePin(id: string) {
    setPinned((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function closePoint(id: string) {
    setPinned((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    setHovered((h) => (h === id ? null : h));
  }

  return (
    <>
      <group ref={groupRef} scale={frame.scale} position={frame.position}>
        <primitive object={model} />
      </group>

      {points.map((p) => {
        const pos = surface[p.id];
        if (!pos) return null;
        const visible = hovered === p.id || pinned.has(p.id);
        return (
          <group key={p.id} position={pos}>
            <Marker
              active={visible}
              onOver={() => {
                setHovered(p.id);
                document.body.style.cursor = "pointer";
              }}
              onOut={() => {
                setHovered((h) => (h === p.id ? null : h));
                document.body.style.cursor = "auto";
              }}
              onClick={() => togglePin(p.id)}
            />
            {visible && <Readout point={p} onClose={() => closePoint(p.id)} />}
          </group>
        );
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

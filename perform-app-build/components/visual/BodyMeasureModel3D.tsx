"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, MarchingCubes, MarchingCube, Html } from "@react-three/drei";
import { useMemo } from "react";

/**
 * Lifelike body model for the measurements page. Built from metaballs
 * (marching cubes) so overlapping muscle masses blend into a single smooth,
 * organic, anatomically-proportioned surface — far closer to real anatomy than
 * disjoint primitives. Tracked measurements are plotted as callouts pinned to
 * the matching body region (value + change since last log).
 *
 * Original procedural work — no third-party/copyrighted mesh is bundled.
 */

const SUBTRACT = 12;

// A ball in field space (0..1, 0.5 = centre) sized by anatomical RADIUS.
// drei maps a child's world position p -> field (0.5 + p*0.5), so field F sits
// at world (F-0.5)*2. Keep the MarchingCubes at scale 1 and frame with camera.
type B = [x: number, y: number, z: number, r: number];

function w(f: number) {
  return (f - 0.5) * 2;
}
function strength(r: number) {
  return SUBTRACT * r * r;
}

// Build the full ball list (mirrored limbs + chained joints).
function buildBalls(): B[] {
  const out: B[] = [];
  const add = (x: number, y: number, z: number, r: number) => out.push([x, y, z, r]);
  const pair = (x: number, y: number, z: number, r: number) => {
    add(x, y, z, r);
    add(1 - x, y, z, r);
  };
  const chain = (pts: B[], segs: number, mirror: boolean) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      for (let k = 0; k <= segs; k++) {
        const t = k / segs;
        const x = a[0] + (b[0] - a[0]) * t;
        const y = a[1] + (b[1] - a[1]) * t;
        const z = a[2] + (b[2] - a[2]) * t;
        const r = a[3] + (b[3] - a[3]) * t;
        add(x, y, z, r);
        if (mirror) add(1 - x, y, z, r);
      }
    }
  };

  // head + neck
  add(0.5, 0.858, 0.5, 0.066);
  add(0.5, 0.8, 0.5, 0.04);
  // torso centre column: chest -> waist -> pelvis (deep front/back via z)
  add(0.5, 0.728, 0.505, 0.105);
  add(0.5, 0.692, 0.508, 0.095);
  add(0.5, 0.652, 0.503, 0.085);
  add(0.5, 0.612, 0.5, 0.074); // waist (narrow)
  add(0.5, 0.577, 0.5, 0.085);
  add(0.5, 0.547, 0.5, 0.096); // pelvis
  // pecs / deltoids / traps / lats / glutes
  pair(0.45, 0.717, 0.555, 0.052);
  pair(0.408, 0.75, 0.5, 0.06);
  pair(0.46, 0.78, 0.49, 0.04);
  pair(0.44, 0.662, 0.478, 0.05);
  pair(0.466, 0.55, 0.452, 0.055);
  // arms: shoulder -> bicep -> elbow -> forearm -> wrist -> hand
  chain(
    [
      [0.41, 0.747, 0.5, 0.055],
      [0.4, 0.702, 0.5, 0.05],
      [0.386, 0.657, 0.5, 0.038],
      [0.376, 0.612, 0.5, 0.042],
      [0.368, 0.567, 0.5, 0.03],
      [0.364, 0.547, 0.5, 0.038],
    ],
    3,
    true
  );
  // legs: hip -> thigh -> aboveknee -> knee -> calf -> shin -> ankle -> foot
  chain(
    [
      [0.462, 0.547, 0.5, 0.07],
      [0.462, 0.472, 0.5, 0.075],
      [0.466, 0.392, 0.5, 0.055],
      [0.468, 0.347, 0.5, 0.05],
      [0.472, 0.287, 0.495, 0.058],
      [0.474, 0.222, 0.5, 0.04],
      [0.476, 0.152, 0.5, 0.034],
      [0.476, 0.117, 0.535, 0.04],
    ],
    3,
    true
  );
  return out;
}

export type MeasurePoint = {
  id: string;
  label: string;
  value: number;
  unit: string;
  delta: number | null;
};

// Anatomical anchors for each measurement callout (field coords; z>0.5 = front).
const ANCHORS: Record<string, { a: [number, number, number]; side: "l" | "r" | "c" }> = {
  neck: { a: [0.5, 0.8, 0.6], side: "c" },
  chest: { a: [0.5, 0.72, 0.66], side: "c" },
  leftArm: { a: [0.4, 0.702, 0.55], side: "l" },
  rightArm: { a: [0.6, 0.702, 0.55], side: "r" },
  waist: { a: [0.5, 0.612, 0.66], side: "c" },
  hips: { a: [0.5, 0.55, 0.66], side: "c" },
  leftThigh: { a: [0.462, 0.47, 0.6], side: "l" },
  rightThigh: { a: [0.538, 0.47, 0.6], side: "r" },
  leftCalf: { a: [0.472, 0.287, 0.58], side: "l" },
  rightCalf: { a: [0.528, 0.287, 0.58], side: "r" },
};

function Callout({ point }: { point: MeasurePoint }) {
  const anchor = ANCHORS[point.id];
  if (!anchor) return null;
  const [fx, fy, fz] = anchor.a;
  const up = point.delta != null && point.delta > 0;
  const down = point.delta != null && point.delta < 0;
  const deltaCls = up ? "text-status-green" : down ? "text-text-1" : "text-text-3";
  const justify = anchor.side === "l" ? "flex-end" : "flex-start";
  return (
    <>
      <mesh position={[w(fx), w(fy), w(fz)]}>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshBasicMaterial color="#189bf5" toneMapped={false} />
      </mesh>
      <Html
        position={[w(fx), w(fy), w(fz)]}
        center
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none", width: 160, display: "flex", justifyContent: justify }}
      >
        <div
          className="rounded-lg border border-white/12 bg-bg-1/85 backdrop-blur-sm px-2 py-1 leading-tight shadow-lg"
          style={{ transform: anchor.side === "l" ? "translateX(-12px)" : anchor.side === "r" ? "translateX(12px)" : "none" }}
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

function Body() {
  const balls = useMemo(() => buildBalls(), []);
  return (
    <MarchingCubes resolution={56} maxPolyCount={120000} enableUvs={false} enableColors={false} scale={1}>
      <meshStandardMaterial color="#aeb7c9" roughness={0.5} metalness={0.05} />
      {balls.map((b, i) => (
        <MarchingCube key={i} position={[w(b[0]), w(b[1]), w(b[2])]} strength={strength(b[3])} subtract={SUBTRACT} />
      ))}
    </MarchingCubes>
  );
}

export default function BodyMeasureModel3D({
  points = [],
  autoRotate = false,
}: {
  points?: MeasurePoint[];
  autoRotate?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [1.15, 0.15, 4.5], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.75} color="#46506a" />
      <hemisphereLight intensity={0.3} groundColor="#0b0f17" />
      <directionalLight position={[3, 5, 4]} intensity={2.4} />
      <directionalLight position={[-4, 2, -3]} intensity={1.5} color="#6f8cff" />
      <directionalLight position={[-2, -1.5, 3]} intensity={0.45} color="#ff9d6f" />
      <Body />
      {points.map((p) => (
        <Callout key={p.id} point={p} />
      ))}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        target={[0, 0, 0]}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.75}
      />
    </Canvas>
  );
}

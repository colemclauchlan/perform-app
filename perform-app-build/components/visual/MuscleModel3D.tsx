"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";

/**
 * Interactive 3D muscle-anatomy figure. Targeted muscle groups glow red
 * (primary brighter than secondary); everything else is neutral. Drag to rotate
 * (front ↔ back); slow auto-rotate otherwise. Reuses the same free-text →
 * region mapping the flat SVG MuscleMap used, so callers pass the same props.
 */

type Level = "primary" | "secondary" | "off";
type Region =
  | "traps" | "chest" | "shoulders" | "biceps" | "triceps" | "forearms"
  | "abs" | "obliques" | "lats" | "lowerback" | "glutes"
  | "quads" | "hamstrings" | "calves";

const ALL_REGIONS: Region[] = [
  "traps", "chest", "shoulders", "biceps", "triceps", "forearms",
  "abs", "obliques", "lats", "lowerback", "glutes", "quads", "hamstrings", "calves",
];

function regionsFor(name: string): Region[] {
  const n = name.toLowerCase();
  const out: Region[] = [];
  const add = (r: Region) => { if (!out.includes(r)) out.push(r); };
  if (/trap/.test(n)) add("traps");
  if (/chest|pec/.test(n)) add("chest");
  if (/shoulder|delt/.test(n)) add("shoulders");
  if (/bicep/.test(n)) add("biceps");
  if (/tricep/.test(n)) add("triceps");
  if (/forearm|grip|brach/.test(n)) add("forearms");
  if (/ab|core|rectus/.test(n)) add("abs");
  if (/oblique/.test(n)) add("obliques");
  if (/lat|back|rhomboid|teres/.test(n)) add("lats");
  if (/lower back|erector|spinal/.test(n)) add("lowerback");
  if (/glute|hip/.test(n)) add("glutes");
  if (/quad|leg|thigh|hip flexor|adductor/.test(n)) add("quads");
  if (/hamstring/.test(n)) add("hamstrings");
  if (/calf|calves|soleus|gastro/.test(n)) add("calves");
  if (/full body/.test(n)) (["chest", "shoulders", "abs", "quads", "lats", "glutes"] as Region[]).forEach(add);
  return out;
}

function buildLevels(primary: string, secondary: string[]): Record<Region, Level> {
  const levels = {} as Record<Region, Level>;
  ALL_REGIONS.forEach((r) => (levels[r] = "off"));
  secondary.forEach((m) => regionsFor(m).forEach((r) => { if (levels[r] === "off") levels[r] = "secondary"; }));
  regionsFor(primary).forEach((r) => (levels[r] = "primary"));
  return levels;
}

const STRUCT = { color: "#3c4554", emissive: "#0a0d14", ei: 0.0, rough: 0.72, metal: 0.05 };
function mat(level: Level) {
  if (level === "primary") return { color: "#ff2e2e", emissive: "#ff2222", ei: 0.6, rough: 0.32, metal: 0.12 };
  if (level === "secondary") return { color: "#dd5a52", emissive: "#5e1414", ei: 0.32, rough: 0.45, metal: 0.1 };
  return { color: "#444e5e", emissive: "#000000", ei: 0.0, rough: 0.66, metal: 0.05 };
}

type Vec = [number, number, number];

// A single mesh. `level` undefined → neutral structural part.
function Part({
  level,
  position,
  rotation,
  scale,
  children,
}: {
  level?: Level;
  position: Vec;
  rotation?: Vec;
  scale?: Vec;
  children: React.ReactNode;
}) {
  const m = level ? mat(level) : STRUCT;
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow>
      {children}
      <meshStandardMaterial
        color={m.color}
        emissive={m.emissive}
        emissiveIntensity={m.ei}
        roughness={m.rough}
        metalness={m.metal}
        flatShading={false}
      />
    </mesh>
  );
}

// Render a paired (left/right) muscle/part by mirroring X.
function Pair({
  level,
  x,
  y,
  z,
  rot,
  scale,
  geom,
}: {
  level?: Level;
  x: number;
  y: number;
  z: number;
  rot?: Vec;
  scale?: Vec;
  geom: () => React.ReactNode;
}) {
  return (
    <>
      <Part level={level} position={[x, y, z]} rotation={rot} scale={scale}>{geom()}</Part>
      <Part
        level={level}
        position={[-x, y, z]}
        rotation={rot ? [rot[0], -rot[1], -rot[2]] : undefined}
        scale={scale}
      >
        {geom()}
      </Part>
    </>
  );
}

function Figure({ levels }: { levels: Record<Region, Level> }) {
  // Higher-poly primitives for smooth, non-jagged muscle bellies.
  const cap = (r: number, l: number): React.ReactNode => <capsuleGeometry args={[r, l, 14, 28]} />;
  const sph = (r: number): React.ReactNode => <sphereGeometry args={[r, 32, 24]} />;
  // Unit sphere shaped into an ellipsoid via the mesh `scale` — replaces every
  // hard-edged box so muscles read as rounded anatomical forms.
  const ell = (): React.ReactNode => <sphereGeometry args={[1, 28, 20]} />;

  return (
    <group position={[0, -0.1, 0]}>
      {/* ── Head / neck ── */}
      <Part position={[0, 1.52, 0]}>{sph(0.26)}</Part>
      <Part position={[0, 1.3, 0]} scale={[0.11, 0.15, 0.11]}>{ell()}</Part>

      {/* ── Traps ── */}
      <Pair level={levels.traps} x={0.16} y={1.12} z={-0.04} rot={[0, 0, 0.5]} scale={[0.12, 0.08, 0.1]} geom={ell} />

      {/* ── Shoulders / delts ── */}
      <Pair level={levels.shoulders} x={0.5} y={1.04} z={0} scale={[0.22, 0.2, 0.22]} geom={ell} />

      {/* ── Torso (smooth tapered trunk) ── */}
      <Part position={[0, 0.84, 0]} scale={[0.33, 0.3, 0.19]}>{ell()}</Part>
      <Part position={[0, 0.46, 0]} scale={[0.3, 0.28, 0.17]}>{ell()}</Part>
      <Part position={[0, 0.1, 0]} scale={[0.27, 0.2, 0.16]}>{ell()}</Part>

      {/* ── Chest / pecs ── */}
      <Pair level={levels.chest} x={0.16} y={0.92} z={0.16} scale={[0.16, 0.14, 0.11]} geom={ell} />

      {/* ── Abs (six-pack) ── */}
      {[0.62, 0.45, 0.28].map((y) => (
        <Pair key={y} level={levels.abs} x={0.08} y={y} z={0.17} scale={[0.072, 0.07, 0.05]} geom={ell} />
      ))}
      {/* ── Obliques ── */}
      <Pair level={levels.obliques} x={0.24} y={0.42} z={0.13} scale={[0.06, 0.17, 0.07]} geom={ell} />

      {/* ── Lats (back) ── */}
      <Pair level={levels.lats} x={0.27} y={0.7} z={-0.16} rot={[0, 0, 0.35]} scale={[0.09, 0.22, 0.07]} geom={ell} />
      {/* ── Lower back ── */}
      <Part level={levels.lowerback} position={[0, 0.46, -0.16]} scale={[0.17, 0.14, 0.07]}>{ell()}</Part>

      {/* ── Upper arms + biceps (front) + triceps (back) ── */}
      <Pair x={0.64} y={0.74} z={0} geom={() => cap(0.12, 0.42)} />
      <Pair level={levels.biceps} x={0.64} y={0.78} z={0.08} geom={() => cap(0.085, 0.3)} />
      <Pair level={levels.triceps} x={0.64} y={0.78} z={-0.08} geom={() => cap(0.085, 0.3)} />

      {/* ── Forearms ── */}
      <Pair level={levels.forearms} x={0.68} y={0.26} z={0.03} geom={() => cap(0.09, 0.4)} />
      {/* hands */}
      <Pair x={0.7} y={-0.02} z={0.04} scale={[0.1, 0.12, 0.06]} geom={ell} />

      {/* ── Glutes (back) ── */}
      <Pair level={levels.glutes} x={0.16} y={-0.14} z={-0.15} scale={[0.18, 0.18, 0.17]} geom={ell} />

      {/* ── Thighs + quads (front) + hamstrings (back) ── */}
      <Pair x={0.2} y={-0.5} z={0} geom={() => cap(0.16, 0.5)} />
      <Pair level={levels.quads} x={0.2} y={-0.5} z={0.09} geom={() => cap(0.12, 0.42)} />
      <Pair level={levels.hamstrings} x={0.2} y={-0.5} z={-0.09} geom={() => cap(0.12, 0.42)} />
      {/* knees */}
      <Pair x={0.2} y={-0.88} z={0.02} geom={() => sph(0.13)} />

      {/* ── Lower legs + calves (back) ── */}
      <Pair x={0.2} y={-1.2} z={0.02} geom={() => cap(0.11, 0.46)} />
      <Pair level={levels.calves} x={0.2} y={-1.16} z={-0.09} geom={() => cap(0.1, 0.36)} />
      {/* feet */}
      <Pair x={0.2} y={-1.55} z={0.08} scale={[0.1, 0.07, 0.2]} geom={ell} />
    </group>
  );
}

export default function MuscleModel3D({
  primary,
  secondary = [],
  autoRotate = true,
}: {
  primary: string;
  secondary?: string[];
  autoRotate?: boolean;
}) {
  const levels = useMemo(() => buildLevels(primary, secondary), [primary, secondary]);

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.2, 4.4], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.7} />
      <hemisphereLight intensity={0.35} groundColor="#0b0f17" />
      <directionalLight position={[3, 4, 5]} intensity={1.5} />
      <directionalLight position={[-4, 1, -3]} intensity={0.7} color="#8ea2ff" />
      <Figure levels={levels} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={autoRotate}
        autoRotateSpeed={1.4}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  );
}

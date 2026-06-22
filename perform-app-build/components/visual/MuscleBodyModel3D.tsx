"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bounds } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";

/**
 * Muscle-highlight body viewer. Loads the same human GLB as the measurements
 * viewer (/public/models/body.glb) and paints the targeted muscle zones onto the
 * mesh surface (primary brighter than secondary) via per-vertex colours.
 * Drag to rotate · scroll to zoom · right-drag to pan.
 */

const MODEL_URL = "/models/body.glb?v=3";
useGLTF.preload(MODEL_URL);

// Set to -1 if the model turns out to face away from the camera (front/back of
// the muscle zones would then be flipped).
const FRONT_Z = 1;

type Level = "primary" | "secondary" | "off";
type Region =
  | "traps" | "chest" | "shoulders" | "biceps" | "triceps" | "forearms"
  | "abs" | "obliques" | "lats" | "lowerback" | "glutes"
  | "quads" | "hamstrings" | "calves";

const ALL_REGIONS: Region[] = [
  "traps", "chest", "shoulders", "biceps", "triceps", "forearms",
  "abs", "obliques", "lats", "lowerback", "glutes", "quads", "hamstrings", "calves",
];

// Free-text muscle name → region(s). Mirrors the old SVG/procedural mapping.
function regionsFor(name: string): Region[] {
  const n = (name || "").toLowerCase();
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

// The mesh has no muscle sub-objects, so we segment it ourselves: each
// anatomical point claims its nearest vertices (Voronoi), giving solid per-muscle
// regions with crisp edges instead of soft radial blobs. "off" points (head,
// hands, feet, throat) keep those areas neutral so they never light up.
// Body-fraction space: x = -1 left … +1 right, y = 0 feet … 1 head, z = -1 back
// … +1 front.
type Seg = { r: Region | "off"; x: number; y: number; z: number };
const SEGMENTS: Seg[] = [
  { r: "off", x: 0, y: 0.93, z: 0 }, //         head
  { r: "off", x: 0, y: 0.85, z: 0.3 }, //       throat / front neck
  { r: "traps", x: 0, y: 0.8, z: -0.35 },
  { r: "shoulders", x: -0.52, y: 0.77, z: 0 },
  { r: "shoulders", x: 0.52, y: 0.77, z: 0 },
  { r: "chest", x: -0.2, y: 0.7, z: 0.75 },
  { r: "chest", x: 0.2, y: 0.7, z: 0.75 },
  { r: "lats", x: -0.33, y: 0.66, z: -0.6 },
  { r: "lats", x: 0.33, y: 0.66, z: -0.6 },
  { r: "abs", x: 0, y: 0.61, z: 0.75 },
  { r: "obliques", x: -0.3, y: 0.6, z: 0.5 },
  { r: "obliques", x: 0.3, y: 0.6, z: 0.5 },
  { r: "lowerback", x: 0, y: 0.58, z: -0.7 },
  { r: "biceps", x: -0.58, y: 0.62, z: 0.5 },
  { r: "biceps", x: 0.58, y: 0.62, z: 0.5 },
  { r: "triceps", x: -0.58, y: 0.62, z: -0.5 },
  { r: "triceps", x: 0.58, y: 0.62, z: -0.5 },
  { r: "forearms", x: -0.66, y: 0.47, z: 0.2 },
  { r: "forearms", x: 0.66, y: 0.47, z: 0.2 },
  { r: "off", x: -0.72, y: 0.37, z: 0.12 }, //  hand
  { r: "off", x: 0.72, y: 0.37, z: 0.12 },
  { r: "glutes", x: -0.2, y: 0.5, z: -0.62 },
  { r: "glutes", x: 0.2, y: 0.5, z: -0.62 },
  { r: "quads", x: -0.2, y: 0.37, z: 0.55 },
  { r: "quads", x: 0.2, y: 0.37, z: 0.55 },
  { r: "hamstrings", x: -0.2, y: 0.37, z: -0.55 },
  { r: "hamstrings", x: 0.2, y: 0.37, z: -0.55 },
  { r: "calves", x: -0.2, y: 0.18, z: -0.4 },
  { r: "calves", x: 0.2, y: 0.18, z: -0.4 },
  { r: "off", x: -0.2, y: 0.03, z: 0.2 }, //    foot
  { r: "off", x: 0.2, y: 0.03, z: 0.2 },
];

// Nearest anatomical point for a vertex (y weighted to the x/z scale).
function classify(fx: number, fy: number, fz: number): Region | "off" {
  let best: Region | "off" = "off";
  let bestD = Infinity;
  for (const s of SEGMENTS) {
    const dx = fx - s.x;
    const dy = (fy - s.y) * 2.1;
    const dz = fz - s.z;
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = s.r;
    }
  }
  return best;
}

const CLAY = new THREE.Color("#aab4c6");
const PRIMARY = new THREE.Color("#ff2424");
const SECONDARY = new THREE.Color("#c8463f");

// Clone + paint each vertex solidly by the muscle group it belongs to.
function paintMuscles(scene: THREE.Object3D, levels: Record<Region, Level>): THREE.Object3D {
  const root = scene.clone(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const hw = (size.x || 1) / 2;
  const hh = size.y || 1;
  const hd = (size.z || 1) / 2;
  const minY = box.min.y;

  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry) return;
    const geo = m.geometry.clone();
    if (!geo.getAttribute("normal")) geo.computeVertexNormals();
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const fx = (v.x - center.x) / hw;
      const fy = (v.y - minY) / hh;
      const fz = (FRONT_Z * (v.z - center.z)) / hd;
      const reg = classify(fx, fy, fz);
      const lvl = reg === "off" ? "off" : levels[reg];
      const col = lvl === "primary" ? PRIMARY : lvl === "secondary" ? SECONDARY : CLAY;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    m.geometry = geo;
    m.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.04, side: THREE.DoubleSide });
  });
  return root;
}

function MuscleBody({ levels }: { levels: Record<Region, Level> }) {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => paintMuscles(scene, levels), [scene, levels]);
  const frame = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const H = 1.7;
    const scale = H / (size.y || 1);
    return { scale, position: [-center.x * scale, -center.y * scale, -center.z * scale] as [number, number, number] };
  }, [model]);

  return (
    <group scale={frame.scale} position={frame.position}>
      <primitive object={model} />
    </group>
  );
}

export default function MuscleBodyModel3D({
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
    <Canvas dpr={[1, 1.8]} camera={{ position: [0.4, 0.1, 5.2], fov: 30 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
      <ambientLight intensity={0.78} color="#46506a" />
      <hemisphereLight intensity={0.3} groundColor="#0b0f17" />
      <directionalLight position={[3, 5, 4]} intensity={2.3} />
      <directionalLight position={[-4, 2, -3]} intensity={1.4} color="#6f8cff" />
      <directionalLight position={[-2, -1.5, 3]} intensity={0.45} color="#ff9d6f" />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.12}>
          <MuscleBody levels={levels} />
        </Bounds>
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        autoRotate={autoRotate}
        autoRotateSpeed={1.1}
        minDistance={1.5}
        maxDistance={16}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 1.5}
      />
    </Canvas>
  );
}

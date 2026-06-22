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

// Muscle zones in body-fraction space: x = -1 left … +1 right, y = 0 feet … 1
// head, z = -1 back … +1 front. r is a soft radius.
const REGION_ZONES: Record<Region, { x: number; y: number; z: number; r: number }[]> = {
  traps:      [{ x: 0, y: 0.8, z: -0.4, r: 0.34 }],
  chest:      [{ x: -0.18, y: 0.69, z: 0.6, r: 0.3 }, { x: 0.18, y: 0.69, z: 0.6, r: 0.3 }],
  shoulders:  [{ x: -0.5, y: 0.75, z: 0.1, r: 0.28 }, { x: 0.5, y: 0.75, z: 0.1, r: 0.28 }],
  biceps:     [{ x: -0.56, y: 0.6, z: 0.4, r: 0.24 }, { x: 0.56, y: 0.6, z: 0.4, r: 0.24 }],
  triceps:    [{ x: -0.56, y: 0.6, z: -0.4, r: 0.24 }, { x: 0.56, y: 0.6, z: -0.4, r: 0.24 }],
  forearms:   [{ x: -0.6, y: 0.48, z: 0.3, r: 0.26 }, { x: 0.6, y: 0.48, z: 0.3, r: 0.26 }],
  abs:        [{ x: 0, y: 0.6, z: 0.6, r: 0.32 }],
  obliques:   [{ x: -0.2, y: 0.6, z: 0.5, r: 0.22 }, { x: 0.2, y: 0.6, z: 0.5, r: 0.22 }],
  lats:       [{ x: -0.3, y: 0.65, z: -0.5, r: 0.3 }, { x: 0.3, y: 0.65, z: -0.5, r: 0.3 }],
  lowerback:  [{ x: 0, y: 0.57, z: -0.6, r: 0.26 }],
  glutes:     [{ x: -0.18, y: 0.5, z: -0.6, r: 0.26 }, { x: 0.18, y: 0.5, z: -0.6, r: 0.26 }],
  quads:      [{ x: -0.2, y: 0.36, z: 0.5, r: 0.34 }, { x: 0.2, y: 0.36, z: 0.5, r: 0.34 }],
  hamstrings: [{ x: -0.2, y: 0.36, z: -0.5, r: 0.34 }, { x: 0.2, y: 0.36, z: -0.5, r: 0.34 }],
  calves:     [{ x: -0.2, y: 0.2, z: -0.4, r: 0.28 }, { x: 0.2, y: 0.2, z: -0.4, r: 0.28 }],
};

function zoneIntensity(fx: number, fy: number, fz: number, z: { x: number; y: number; z: number; r: number }) {
  const dx = fx - z.x;
  const dy = (fy - z.y) * 2.0; // y spans 0..1, x/z span -1..1 — weight to match
  const dz = fz - z.z;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return d < z.r ? 1 - d / z.r : 0;
}

const CLAY = new THREE.Color("#b9c2d4");
const PRIMARY = new THREE.Color("#ff3b3b");
const SECONDARY = new THREE.Color("#cf5b54");

// Clone + paint the targeted muscle zones into per-vertex colours.
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

  const primaryZones = ALL_REGIONS.filter((r) => levels[r] === "primary").flatMap((r) => REGION_ZONES[r]);
  const secondaryZones = ALL_REGIONS.filter((r) => levels[r] === "secondary").flatMap((r) => REGION_ZONES[r]);

  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry) return;
    const geo = m.geometry.clone();
    if (!geo.getAttribute("normal")) geo.computeVertexNormals();
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const v = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const fx = (v.x - center.x) / hw;
      const fy = (v.y - minY) / hh;
      const fz = (FRONT_Z * (v.z - center.z)) / hd;
      c.copy(CLAY);
      let sInt = 0;
      for (const z of secondaryZones) sInt = Math.max(sInt, zoneIntensity(fx, fy, fz, z));
      if (sInt > 0) c.lerp(SECONDARY, Math.min(1, sInt));
      let pInt = 0;
      for (const z of primaryZones) pInt = Math.max(pInt, zoneIntensity(fx, fy, fz, z));
      if (pInt > 0) c.lerp(PRIMARY, Math.min(1, pInt));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    m.geometry = geo;
    m.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.04, side: THREE.DoubleSide });
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

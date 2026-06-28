"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * SignalHero — the "Vital Signal" motif in live WebGL: a near-closed loop (the
 * ring that never quite completes) with one orbiting mint node, a drifting
 * particle field, and a breathing core glow. Ported from the design kit
 * (ui_kits/app/Signal3D.jsx). Degrades to a static CSS glow if WebGL is absent.
 */

function createSignalScene(opts: { ringColor?: number; nodeColor?: number }) {
  const ringColor = opts.ringColor || 0x189bf5;
  const nodeColor = opts.nodeColor || 0x2fe3a8;
  let renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    group: THREE.Group,
    ring: THREE.Mesh,
    node: THREE.Mesh,
    nodeGlow: THREE.Sprite,
    core: THREE.Sprite,
    particles: THREE.Points;
  let raf = 0;
  const t0 = performance.now();
  let px = 0,
    py = 0,
    tpx = 0,
    tpy = 0;
  let el: HTMLElement | null = null;

  function radialGlow() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.3, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  function dotTex() {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.beginPath();
    x.arc(16, 16, 16, 0, Math.PI * 2);
    x.fill();
    return new THREE.CanvasTexture(c);
  }

  function init(canvas: HTMLCanvasElement) {
    el = canvas.parentElement;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 8.4);

    group = new THREE.Group();
    group.rotation.x = -0.34;
    scene.add(group);

    const R = 2.5,
      gap = Math.PI * 0.34;
    const curve = new THREE.Curve<THREE.Vector3>();
    curve.getPoint = function (u: number, target?: THREE.Vector3) {
      const tgt = target || new THREE.Vector3();
      const a = gap / 2 + u * (Math.PI * 2 - gap);
      return tgt.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    };
    const tube = new THREE.TubeGeometry(curve, 160, 0.055, 16, false);
    ring = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.92 }));
    group.add(ring);

    const tube2 = new THREE.TubeGeometry(curve, 120, 0.17, 12, false);
    const ringGlow = new THREE.Mesh(
      tube2,
      new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(ringGlow);

    node = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), new THREE.MeshBasicMaterial({ color: 0xeafff7 }));
    group.add(node);
    nodeGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: radialGlow(), color: nodeColor, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    nodeGlow.scale.set(1.5, 1.5, 1);
    group.add(nodeGlow);
    (ring.userData as { curve: THREE.Curve<THREE.Vector3> }).curve = curve;

    core = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: radialGlow(), color: ringColor, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    core.scale.set(7, 7, 1);
    core.position.z = -1;
    scene.add(core);

    const N = 90,
      pos = new Float32Array(N * 3),
      seed: number[] = [];
    for (let i = 0; i < N; i++) {
      const rr = 1.4 + Math.random() * 3.4,
        a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * rr;
      pos[i * 3 + 1] = Math.sin(a) * rr;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
      seed.push(Math.random() * Math.PI * 2);
    }
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    particles = new THREE.Points(
      pgeo,
      new THREE.PointsMaterial({ color: ringColor, size: 0.06, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, map: dotTex() })
    );
    (particles.userData as { seed: number[]; base: Float32Array }) = { seed, base: pos.slice() };
    group.add(particles);

    resize();
    window.addEventListener("resize", resize);
    animate();
    return true;
  }

  function setPointer(nx: number, ny: number) {
    tpx = nx;
    tpy = ny;
  }

  function animate() {
    raf = requestAnimationFrame(animate);
    const t = (performance.now() - t0) / 1000;
    px += (tpx - px) * 0.06;
    py += (tpy - py) * 0.06;
    group.rotation.z = t * 0.12;
    group.rotation.y = px * 0.5;
    group.rotation.x = -0.34 + py * 0.35;

    const u = (t * 0.16) % 1;
    const curve = (ring.userData as { curve: THREE.Curve<THREE.Vector3> }).curve;
    const p = curve.getPoint(u);
    node.position.copy(p);
    nodeGlow.position.copy(p);
    const pulse = 1 + Math.sin(t * 3.1) * 0.28;
    nodeGlow.scale.set(1.5 * pulse, 1.5 * pulse, 1);

    (core.material as THREE.SpriteMaterial).opacity = 0.16 + 0.1 * (0.5 + 0.5 * Math.sin(t * 1.3));

    const arr = (particles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const ud = particles.userData as { seed: number[]; base: Float32Array };
    for (let i = 0; i < ud.seed.length; i++) {
      arr[i * 3 + 2] = ud.base[i * 3 + 2] + Math.sin(t * 0.6 + ud.seed[i]) * 0.25;
    }
    (particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    renderer.render(scene, camera);
  }

  function resize() {
    if (!el) return;
    const w = el.clientWidth,
      h = el.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function dispose() {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    scene &&
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material & { map?: THREE.Texture };
        if (mat) {
          mat.map && mat.map.dispose();
          mat.dispose();
        }
      });
    renderer && renderer.dispose();
  }

  return { init, setPointer, dispose };
}

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const end = Number(value) || 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const duration = 900;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    const tick = (t: number) => {
      if (start == null) start = t;
      const p = Math.min(1, (t - start) / duration);
      setN(end * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const safety = setTimeout(() => setN(end), duration + 500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
    };
  }, [end]);
  return <>{decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString()}</>;
}

export function SignalHero({
  eyebrow,
  title,
  stat,
  statUnit,
  statSub,
  decimals = 0,
  ringColor = 0x189bf5,
  nodeColor = 0x2fe3a8,
  accentVar = "#2fe3a8",
  caption,
}: {
  eyebrow: string;
  title: string;
  stat?: number | null;
  statUnit?: string;
  statSub?: string;
  decimals?: number;
  ringColor?: number;
  nodeColor?: number;
  accentVar?: string;
  caption?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const scene = createSignalScene({ ringColor, nodeColor });
    const ok = canvasRef.current && scene.init(canvasRef.current);
    if (!ok) {
      setWebgl(false);
      return;
    }
    const wrap = wrapRef.current!;
    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      scene.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    const onLeave = () => scene.setPointer(0, 0);
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);
    return () => {
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
      scene.dispose();
    };
  }, [ringColor, nodeColor]);

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-xl border border-border bg-bg-1 mb-4 flex items-center animate-fade-in"
      style={{ minHeight: 156 }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(120% 140% at 88% 50%, color-mix(in oklab, ${accentVar} 14%, transparent) 0%, transparent 55%)` }}
      />
      <div
        className="absolute top-0 right-0 bottom-0"
        style={{ width: "52%", maskImage: "linear-gradient(90deg, transparent, #000 32%)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 32%)" }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
        {!webgl && (
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(circle at 60% 50%, color-mix(in oklab, ${accentVar} 40%, transparent), transparent 60%)` }}
          />
        )}
      </div>
      <div className="relative z-[2] px-6 py-6">
        <div className="lab-label mb-2.5 flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentVar, boxShadow: `0 0 8px ${accentVar}` }} />
          {eyebrow}
        </div>
        <div className="font-display font-bold tracking-tight leading-[1.05] text-[27px] max-w-[360px]">{title}</div>
        {stat != null && (
          <div className="flex items-baseline gap-2 mt-3.5">
            <span className="font-display font-bold leading-none tracking-tight tabular-nums text-[38px]" style={{ color: accentVar }}>
              <CountUp value={stat} decimals={decimals} />
            </span>
            {statUnit && <span className="data text-[13px] text-text-3">{statUnit}</span>}
            {statSub && <span className="data text-[12px] text-status-green ml-1">{statSub}</span>}
          </div>
        )}
        {caption && <div className="text-[12.5px] text-text-3 mt-2.5 max-w-[320px] leading-[1.45]">{caption}</div>}
      </div>
    </div>
  );
}

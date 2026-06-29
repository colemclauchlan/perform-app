// phoneScene.ts — 3D floating webapp feature-preview panels (carousel in 3D space)
// with a scroll-reactive point-light glow. Ported from the marketing kit's
// phone3d.js to use the bundled `three` instead of a global THREE.
import * as THREE from "three";

export type PhoneScene = ReturnType<typeof createPhoneScene>;

export function createPhoneScene() {
  let renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    group: THREE.Group,
    glowLight: THREE.PointLight,
    mintLight: THREE.PointLight,
    rim: THREE.DirectionalLight,
    halo: THREE.Sprite;
  let panels: THREE.Group[] = [];
  let ro: ResizeObserver | null = null;
  let w = 0, h = 0;
  let curAngle = 0, fp = 0, fpTarget = 0, auto = true, centered = false;
  let dragging = false, lastX = 0;
  let scroll = 0, active = 0;
  let raf = 0;
  const N = 5, RADIUS = 4.4, STEP = (Math.PI * 2) / 5;
  const FEATURE_COLORS = [0x189bf5, 0x2fe3a8, 0xf56565, 0x63b3ed, 0xb794f6];
  const TITLES = ["NUTRITION", "TRAINING", "COMPOUNDS", "BLOODWORK", "AI COACH"];

  function init(canvas: HTMLCanvasElement) {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    group = new THREE.Group();
    scene.add(group);

    const geo = roundedPlane(4.4, 2.9, 0.18, 6);
    for (let i = 0; i < N; i++) {
      const tex = new THREE.CanvasTexture(drawScreen(i));
      tex.anisotropy = 4;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const panel = new THREE.Mesh(geo, mat);
      const frame = new THREE.Mesh(roundedPlane(4.56, 3.06, 0.2, 6), new THREE.MeshBasicMaterial({ color: 0x0b1320, transparent: true }));
      frame.position.z = -0.02;
      const holder = new THREE.Group();
      holder.add(frame);
      holder.add(panel);
      holder.userData = { i, mat, panel, frameMat: frame.material };
      group.add(holder);
      panels.push(holder);
    }

    scene.add(new THREE.AmbientLight(0x2a3a52, 0.7));
    glowLight = new THREE.PointLight(0x189bf5, 30, 40, 2);
    glowLight.position.set(0, 2, 6);
    scene.add(glowLight);
    mintLight = new THREE.PointLight(0x2fe3a8, 16, 36, 2);
    mintLight.position.set(-5, -3, 4);
    scene.add(mintLight);
    rim = new THREE.DirectionalLight(0xcfe3ff, 0.5);
    rim.position.set(2, 4, 6);
    scene.add(rim);

    halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialGlow(), color: 0x189bf5, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.set(16, 16, 1);
    halo.position.set(0, 0, -4);
    scene.add(halo);

    bindDrag(canvas);
    window.addEventListener("resize", resize);
    resize();
    // The fixed stage may not have its final size yet when init runs; observe it
    // and re-size once layout settles so the carousel fills the canvas.
    if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
      ro = new ResizeObserver(() => resize());
      ro.observe(canvas.parentElement);
    }
    requestAnimationFrame(resize);
    setTimeout(resize, 200);
    animate();
    return true;
  }

  function bindDrag(canvas: HTMLCanvasElement) {
    const stage = canvas.parentElement!;
    stage.addEventListener("pointerdown", (e) => { dragging = true; lastX = cx(e); });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const x = cx(e);
      curAngle += (x - lastX) * 0.008;
      lastX = x;
      fp = -curAngle / STEP;
      fpTarget = fp;
    });
    window.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      fpTarget = Math.round(fp);
    });
  }
  function cx(e: PointerEvent) { return e.clientX; }

  function setScroll(p: number) { scroll = Math.max(0, Math.min(1, p)); }
  function setFeatureProgress(v: number) {
    if (dragging) return;
    const k = Math.round((fp - v) / N);
    fpTarget = v + k * N;
  }
  function setAuto(b: boolean) { auto = !!b; }
  function setCentered(b: boolean) { centered = !!b; if (renderer) resize(); }
  function setFeature(i: number) { setFeatureProgress(((i % N) + N) % N); }
  function grab(on: boolean) {
    const s = renderer && renderer.domElement.parentElement;
    if (s) s.classList.toggle("is-grab", !!on);
  }

  const colCur = new THREE.Color(0x189bf5);
  function animate() {
    raf = requestAnimationFrame(animate);
    if (!dragging) {
      if (auto) fpTarget += 0.0045;
      fp += (fpTarget - fp) * 0.18;
      const t = -fp * STEP;
      curAngle += (t - curAngle) * 0.3;
    }
    active = ((Math.round(fp) % N) + N) % N;
    const sway = Math.sin(performance.now() * 0.0004) * 0.03;

    panels.forEach((holder) => {
      const ud = holder.userData as { i: number; mat: THREE.MeshBasicMaterial; frameMat: THREE.MeshBasicMaterial };
      const a = curAngle + sway + ud.i * STEP;
      holder.position.x = Math.sin(a) * RADIUS;
      holder.position.z = Math.cos(a) * RADIUS - RADIUS;
      holder.position.y = Math.sin(scroll * Math.PI * 2 + ud.i) * 0.16;
      holder.rotation.y = a;
      const front = (Math.cos(a) + 1) / 2;
      const vis = Math.pow(front, 7);
      holder.scale.setScalar(0.7 + front * 0.55);
      ud.mat.opacity = vis;
      ud.frameMat.opacity = vis * 0.96;
      holder.visible = vis > 0.01;
    });

    const target = new THREE.Color(FEATURE_COLORS[active]);
    colCur.lerp(target, 0.06);
    glowLight.color.copy(colCur);
    (halo.material as THREE.SpriteMaterial).color.copy(colCur);
    glowLight.intensity = 24 + Math.sin(performance.now() * 0.0015) * 6 + scroll * 16;
    (halo.material as THREE.SpriteMaterial).opacity = 0.22 + 0.14 * (0.5 + 0.5 * Math.sin(performance.now() * 0.0012));

    renderer.render(scene, camera);
  }

  function resize() {
    const stage = renderer.domElement.parentElement!;
    w = stage.clientWidth;
    h = stage.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    group.position.x = centered ? 0 : w > 980 ? 3.3 : 0;
    group.position.y = centered ? -1.9 : 0;
    halo.position.x = group.position.x;
    halo.position.y = group.position.y;
    camera.position.z = centered || w <= 980 ? 13 : 11;
  }

  function dispose() {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    ro?.disconnect();
    scene &&
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as (THREE.Material & { map?: THREE.Texture }) | undefined;
        if (mat) { mat.map && mat.map.dispose(); mat.dispose(); }
      });
    renderer && renderer.dispose();
  }

  // ---------- drawn webapp screens (landscape) ----------
  function drawScreen(i: number) {
    const c = document.createElement("canvas");
    c.width = 660;
    c.height = 435;
    const x = c.getContext("2d")!;
    const g = x.createLinearGradient(0, 0, 0, 435);
    g.addColorStop(0, "#16202f");
    g.addColorStop(1, "#0e1623");
    x.fillStyle = g;
    x.fillRect(0, 0, 660, 435);
    x.fillStyle = "#131d2c";
    x.fillRect(0, 0, 120, 435);
    x.fillStyle = ["#189bf5", "#2fe3a8", "#f56565", "#63b3ed", "#b794f6"][i];
    round(x, 18, 22, 22, 22, 6);
    x.fill();
    x.fillStyle = "rgba(159,176,192,0.25)";
    for (let k = 0; k < 6; k++) { round(x, 18, 70 + k * 30, 84, 12, 6); x.fill(); }
    x.fillStyle = "#eef3f8";
    x.font = "700 26px sans-serif";
    x.fillText(TITLES[i], 150, 56);
    const accent = ["#189bf5", "#2fe3a8", "#f56565", "#63b3ed", "#b794f6"][i];
    if (i === 0) ringSet(x, accent);
    else if (i === 1) barSet(x, accent);
    else if (i === 2) timerSet(x);
    else if (i === 3) lineSet(x, accent);
    else chatSet(x, accent);
    return c;
  }
  function card(x: CanvasRenderingContext2D, px: number, py: number, pw: number, ph: number) {
    x.fillStyle = "#1a2433"; round(x, px, py, pw, ph, 12); x.fill();
    x.strokeStyle = "rgba(159,176,192,0.1)"; x.lineWidth = 1; x.stroke();
  }
  function ringSet(x: CanvasRenderingContext2D, ac: string) {
    const cols = ["#189bf5", "#2fe3a8", "#f6ad55", "#63b3ed"];
    for (let k = 0; k < 4; k++) {
      const cx0 = 215 + k * 110, cy0 = 150;
      card(x, cx0 - 48, 90, 96, 120);
      x.lineWidth = 11; x.strokeStyle = "rgba(159,176,192,0.16)"; x.beginPath(); x.arc(cx0, cy0, 34, 0, Math.PI * 2); x.stroke();
      x.strokeStyle = cols[k]; x.lineCap = "round"; x.beginPath(); x.arc(cx0, cy0, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * (1.1 + k * 0.2)); x.stroke();
    }
    card(x, 150, 240, 480, 150);
    x.strokeStyle = ac; x.lineWidth = 3; x.beginPath();
    [0.5, 0.7, 0.45, 0.85, 0.6, 0.9, 0.7].forEach((p, k) => { const px = 180 + k * 70, py = 360 - p * 90; k ? x.lineTo(px, py) : x.moveTo(px, py); });
    x.stroke();
  }
  function barSet(x: CanvasRenderingContext2D, ac: string) {
    card(x, 150, 90, 480, 300);
    const vals = [0.5, 0.7, 0.6, 0.9, 0.55, 0.8, 0.95];
    vals.forEach((v, k) => { const bx = 180 + k * 62; const bh = v * 230; x.fillStyle = k === vals.length - 1 ? ac : "rgba(24,155,245,0.5)"; round(x, bx, 360 - bh, 40, bh, 8); x.fill(); });
  }
  function timerSet(x: CanvasRenderingContext2D) {
    const labels: [string, number][] = [["#189bf5", 0.7], ["#2fe3a8", 0.4], ["#f56565", 0.95], ["#b794f6", 0.55]];
    labels.forEach((l, k) => {
      const py = 90 + k * 78; card(x, 150, py, 480, 64);
      x.fillStyle = l[0]; round(x, 168, py + 22, 20, 20, 5); x.fill();
      x.fillStyle = "rgba(159,176,192,0.5)"; round(x, 200, py + 26, 200, 12, 6); x.fill();
      x.fillStyle = "rgba(159,176,192,0.15)"; round(x, 430, py + 24, 180, 16, 8); x.fill();
      x.fillStyle = l[0]; round(x, 430, py + 24, 180 * l[1], 16, 8); x.fill();
    });
  }
  function lineSet(x: CanvasRenderingContext2D, ac: string) {
    card(x, 150, 90, 480, 300);
    x.strokeStyle = "rgba(159,176,192,0.12)"; x.lineWidth = 1;
    for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(170, 110 + k * 65); x.lineTo(610, 110 + k * 65); x.stroke(); }
    x.strokeStyle = ac; x.lineWidth = 3.5; x.lineJoin = "round"; x.beginPath();
    [0.4, 0.55, 0.45, 0.7, 0.6, 0.8, 0.65, 0.9].forEach((p, k) => { const px = 175 + k * 60, py = 360 - p * 230; k ? x.lineTo(px, py) : x.moveTo(px, py); });
    x.stroke();
    [0.4, 0.55, 0.45, 0.7, 0.6, 0.8, 0.65, 0.9].forEach((p, k) => { const px = 175 + k * 60, py = 360 - p * 230; x.fillStyle = ac; x.beginPath(); x.arc(px, py, 4, 0, Math.PI * 2); x.fill(); });
  }
  function chatSet(x: CanvasRenderingContext2D, ac: string) {
    const bubbles: [number, number][] = [[0, 0.6], [1, 0.5], [0, 0.75], [1, 0.4]];
    bubbles.forEach((b, k) => {
      const py = 95 + k * 74; const bw = 300 * (b[1] + 0.3);
      const right = b[0] === 1;
      x.fillStyle = right ? ac : "#1a2433";
      const bx = right ? 610 - bw : 150;
      round(x, bx, py, bw, 56, 14); x.fill();
      x.fillStyle = right ? "rgba(4,16,29,0.5)" : "rgba(159,176,192,0.4)";
      round(x, bx + 16, py + 16, bw - 32, 10, 5); x.fill();
      round(x, bx + 16, py + 32, (bw - 32) * 0.7, 10, 5); x.fill();
    });
  }

  // ---------- geometry / textures ----------
  function roundedPlane(width: number, height: number, radius: number, seg: number) {
    const s = new THREE.Shape();
    const w2 = width / 2, h2 = height / 2, r = radius;
    s.moveTo(-w2 + r, -h2);
    s.lineTo(w2 - r, -h2); s.quadraticCurveTo(w2, -h2, w2, -h2 + r);
    s.lineTo(w2, h2 - r); s.quadraticCurveTo(w2, h2, w2 - r, h2);
    s.lineTo(-w2 + r, h2); s.quadraticCurveTo(-w2, h2, -w2, h2 - r);
    s.lineTo(-w2, -h2 + r); s.quadraticCurveTo(-w2, -h2, -w2 + r, -h2);
    const geo = new THREE.ShapeGeometry(s, seg || 6);
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const sz = new THREE.Vector2(bb.max.x - bb.min.x, bb.max.y - bb.min.y);
    const pos = geo.attributes.position;
    const uv: number[] = [];
    for (let k = 0; k < pos.count; k++) { uv.push((pos.getX(k) - bb.min.x) / sz.x, (pos.getY(k) - bb.min.y) / sz.y); }
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    return geo;
  }
  function radialGlow() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(210,235,255,0.7)");
    g.addColorStop(0.25, "rgba(150,205,255,0.3)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }
  function round(x: CanvasRenderingContext2D, px: number, py: number, pw: number, ph: number, r: number) {
    x.beginPath();
    x.moveTo(px + r, py);
    x.arcTo(px + pw, py, px + pw, py + ph, r);
    x.arcTo(px + pw, py + ph, px, py + ph, r);
    x.arcTo(px, py + ph, px, py, r);
    x.arcTo(px, py, px + pw, py, r);
    x.closePath();
  }

  return { init, setScroll, setFeature, setFeatureProgress, setAuto, setCentered, grab, dispose, getActive: () => active, getFp: () => fp };
}

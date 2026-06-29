"use client";

import "./landing.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { createPhoneScene, type PhoneScene } from "./phoneScene";

type Side = "left" | "right";
const FEATURES: { num: string; title: string; copy: string; bullets: string[]; icon: string; side: Side }[] = [
  {
    num: "01 / NUTRITION", side: "left",
    icon: `<svg width="24" height="24" fill="none" stroke="#3aa6f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18M3 11a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4M5 11v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>`,
    title: "Macros, logged in seconds.",
    copy: "Search, barcode quick-add, reusable meal plans, and an AI meal-plan builder. Hit your calories, protein, carbs, and fat — then let AI review the day.",
    bullets: ["Fast food logging & quick-add", "AI meal-plan builder", "AI nutrition review"],
  },
  {
    num: "02 / TRAINING", side: "right",
    icon: `<svg width="24" height="24" fill="none" stroke="#2fe3a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5 17.5 17.5M21 21l-1-1M3 3l1 1M18 6l3-3M6 18l-3 3M3 7l4 4M17 13l4 4"/></svg>`,
    title: "Every set, RPE, and e1RM.",
    copy: "Log sets, reps, RPE and supersets. Watch strength progression curve, run AI-generated programs, and read muscle-split analytics from a 225+ exercise library.",
    bullets: ["e1RM strength progression", "AI program generator", "225+ exercise library"],
  },
  {
    num: "03 / COMPOUNDS", side: "left",
    icon: `<svg width="24" height="24" fill="none" stroke="#f56565" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4M17 7 7 17M7 7l10 10M14 6l4 4M2 22l5-5M11 13l-2 2"/></svg>`,
    title: "Protocols, dosed precisely.",
    copy: "Dosing schedules, one-tap dose logging, a peptide calculator, and a steady-state blood-concentration model — so every injection is on the curve, not guessed.",
    bullets: ["Protocol & dose tracking", "Peptide reconstitution calculator", "Plasma-concentration curves"],
  },
  {
    num: "04 / BLOODWORK", side: "right",
    icon: `<svg width="24" height="24" fill="none" stroke="#63b3ed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/></svg>`,
    title: "Panels, flagged and read.",
    copy: "Import blood panels by photo or PDF. Out-of-range markers flag against reference ranges, plotted over time — with AI analysis that factors your protocol.",
    bullets: ["Flagged out-of-range markers", "Import by photo or PDF", "AI panel analysis"],
  },
  {
    num: "05 / AI COACH", side: "left",
    icon: `<svg width="24" height="24" fill="none" stroke="#b794f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v2M5 7l1.5 1.5M19 7l-1.5 1.5M12 8a5 5 0 0 0-5 5c0 2 1 3 1 4h8c0-1 1-2 1-4a5 5 0 0 0-5-5ZM9 21h6"/></svg>`,
    title: "A coach that reads everything.",
    copy: "One chat with your full health history in context — bloods, macros, lifts, doses, sleep. Ask anything; get an answer backed by your own numbers.",
    bullets: ["Full-history context", "Health · Gym · PED dashboards", "Decisions backed by data"],
  },
];

const SHOWCASE: { tag: string; title: string; desc: string; vis: string }[] = [
  { tag: "Nutrition", title: "Macro tracker", desc: "Calories, protein, carbs, fat against daily targets — with reusable meal plans.", vis: `<svg viewBox="0 0 320 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><g fill="none"><circle cx="80" cy="70" r="34" stroke="rgba(159,176,192,0.18)" stroke-width="9"/><circle cx="80" cy="70" r="34" stroke="#189bf5" stroke-width="9" stroke-linecap="round" stroke-dasharray="170 60" transform="rotate(-90 80 70)"/></g><text x="80" y="76" fill="#eef3f8" font-family="sans-serif" font-weight="700" font-size="20" text-anchor="middle">82%</text><g><rect x="150" y="44" width="140" height="11" rx="5" fill="#189bf5"/><rect x="150" y="68" width="110" height="11" rx="5" fill="#2fe3a8"/><rect x="150" y="92" width="90" height="11" rx="5" fill="#f6ad55"/></g></svg>` },
  { tag: "Training", title: "Workout log", desc: "Sets, reps, RPE, supersets and e1RM progression across every session.", vis: `<svg viewBox="0 0 320 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><g><rect x="30" y="80" width="30" height="50" rx="5" fill="rgba(47,227,168,0.5)"/><rect x="74" y="58" width="30" height="72" rx="5" fill="rgba(47,227,168,0.6)"/><rect x="118" y="92" width="30" height="38" rx="5" fill="rgba(47,227,168,0.45)"/><rect x="162" y="40" width="30" height="90" rx="5" fill="rgba(47,227,168,0.7)"/><rect x="206" y="66" width="30" height="64" rx="5" fill="rgba(47,227,168,0.55)"/><rect x="250" y="28" width="30" height="102" rx="5" fill="#2fe3a8"/></g></svg>` },
  { tag: "Compounds", title: "PED protocols", desc: "Dosing schedules, one-tap logging, dose history and a peptide calculator.", vis: `<svg viewBox="0 0 320 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><g font-family="monospace" font-size="11"><rect x="24" y="26" width="272" height="26" rx="6" fill="rgba(245,101,101,0.14)"/><circle cx="40" cy="39" r="6" fill="#f56565"/><rect x="56" y="34" width="120" height="10" rx="5" fill="rgba(159,176,192,0.4)"/><rect x="200" y="35" width="80" height="8" rx="4" fill="#f56565"/><rect x="24" y="62" width="272" height="26" rx="6" fill="rgba(24,155,245,0.12)"/><circle cx="40" cy="75" r="6" fill="#189bf5"/><rect x="56" y="70" width="120" height="10" rx="5" fill="rgba(159,176,192,0.4)"/><rect x="200" y="71" width="50" height="8" rx="4" fill="#189bf5"/><rect x="24" y="98" width="272" height="26" rx="6" fill="rgba(47,227,168,0.12)"/><circle cx="40" cy="111" r="6" fill="#2fe3a8"/><rect x="56" y="106" width="120" height="10" rx="5" fill="rgba(159,176,192,0.4)"/><rect x="200" y="107" width="64" height="8" rx="4" fill="#2fe3a8"/></g></svg>` },
  { tag: "Bloodwork", title: "Lab panels", desc: "Flagged markers, reference ranges and trends — imported by photo or PDF.", vis: `<svg viewBox="0 0 320 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><g stroke="rgba(159,176,192,0.12)" stroke-width="1"><line x1="20" y1="45" x2="300" y2="45"/><line x1="20" y1="80" x2="300" y2="80"/><line x1="20" y1="115" x2="300" y2="115"/></g><polyline points="24,100 70,82 116,92 162,58 208,70 254,40 296,52" fill="none" stroke="#63b3ed" stroke-width="3" stroke-linejoin="round"/><g fill="#63b3ed"><circle cx="70" cy="82" r="3.5"/><circle cx="162" cy="58" r="3.5"/><circle cx="254" cy="40" r="3.5"/></g></svg>` },
  { tag: "Vitals", title: "Body & recovery", desc: "Weight, girth on a 3D map, blood pressure, sugar, sleep, hydration and steps.", vis: `<svg viewBox="0 0 320 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke-width="9"><path d="M60 118 A100 100 0 0 1 260 118" stroke="rgba(159,176,192,0.16)" stroke-linecap="round"/><path d="M60 118 A100 100 0 0 1 219 37" stroke="#189bf5" stroke-linecap="round"/></g><circle cx="219" cy="37" r="6" fill="#2fe3a8"/><text x="160" y="104" fill="#eef3f8" font-family="sans-serif" font-weight="700" font-size="22" text-anchor="middle">7.2h</text></svg>` },
  { tag: "Intelligence", title: "AI coach", desc: "A chat that reads your entire history and answers in context.", vis: `<svg viewBox="0 0 320 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><rect x="20" y="28" width="180" height="34" rx="14" fill="#1f2b3c"/><rect x="34" y="40" width="120" height="9" rx="4" fill="rgba(159,176,192,0.4)"/><rect x="120" y="74" width="180" height="34" rx="14" fill="#b794f6"/><rect x="134" y="86" width="130" height="9" rx="4" fill="rgba(4,16,29,0.45)"/><rect x="20" y="118" width="120" height="22" rx="11" fill="#1f2b3c"/><rect x="34" y="125" width="70" height="8" rx="4" fill="rgba(159,176,192,0.4)"/></svg>` },
  { tag: "Nutrition · AI", title: "AI meal planning", desc: "Generate a full day of meals to hit your macros — then tweak, save and reuse.", vis: `<svg viewBox="0 0 320 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><g><rect x="28" y="26" width="220" height="22" rx="6" fill="rgba(24,155,245,0.16)"/><rect x="28" y="56" width="220" height="22" rx="6" fill="rgba(47,227,168,0.14)"/><rect x="28" y="86" width="220" height="22" rx="6" fill="rgba(246,173,85,0.14)"/><circle cx="44" cy="37" r="5" fill="#189bf5"/><circle cx="44" cy="67" r="5" fill="#2fe3a8"/><circle cx="44" cy="97" r="5" fill="#f6ad55"/><rect x="60" y="32" width="150" height="9" rx="4" fill="rgba(159,176,192,0.4)"/><rect x="60" y="62" width="120" height="9" rx="4" fill="rgba(159,176,192,0.4)"/><rect x="60" y="92" width="135" height="9" rx="4" fill="rgba(159,176,192,0.4)"/><path d="M280 28 l4.5 11 11 4.5 -11 4.5 -4.5 11 -4.5 -11 -11 -4.5 11 -4.5 z" fill="#189bf5"/></g></svg>` },
  { tag: "Training · AI", title: "AI workout creation", desc: "Auto-generate a full training program around your goals, schedule and lifts.", vis: `<svg viewBox="0 0 320 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><g><rect x="40" y="80" width="26" height="40" rx="5" fill="rgba(47,227,168,0.5)"/><rect x="78" y="60" width="26" height="60" rx="5" fill="rgba(47,227,168,0.65)"/><rect x="116" y="44" width="26" height="76" rx="5" fill="#2fe3a8"/><rect x="154" y="70" width="26" height="50" rx="5" fill="rgba(47,227,168,0.55)"/><rect x="200" y="92" width="84" height="10" rx="5" fill="rgba(159,176,192,0.35)"/><rect x="200" y="110" width="56" height="10" rx="5" fill="rgba(159,176,192,0.25)"/><path d="M252 30 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5 z" fill="#2fe3a8"/></g></svg>` },
];

const check = `<svg width="16" height="16" fill="none" stroke="#2fe3a8" stroke-width="2.4" stroke-linecap="round"><path d="M2 8l4 4 8-9"/></svg>`;
const checkBlue = `<svg width="16" height="16" fill="none" stroke="#3aa6f7" stroke-width="2.4" stroke-linecap="round"><path d="M2 8l4 4 8-9"/></svg>`;
const cross = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>`;

type AuthMode = "signin" | "signup" | "premium";

export function LandingPage() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const openAuth = (mode: AuthMode) => { setAuthMode(mode); setMsg(null); setAuthOpen(true); };

  // ---- Three.js phones + scroll orchestration (ported from landing.js) ----
  useEffect(() => {
    const root = rootRef.current!;
    const stage = root.querySelector<HTMLElement>("#phone-stage");
    const stage2 = root.querySelector<HTMLElement>("#phone-stage-2");
    let phone: PhoneScene | null = null;
    let phone2: PhoneScene | null = null;

    try {
      phone = createPhoneScene();
      if (!canvasRef.current || !phone.init(canvasRef.current)) phone = null;
    } catch { phone = null; }
    if (!phone && stage) stage.style.display = "none";

    if (canvas2Ref.current) {
      try {
        phone2 = createPhoneScene();
        if (!phone2.init(canvas2Ref.current)) phone2 = null;
      } catch { phone2 = null; }
    }
    if (phone2) { phone2.setCentered(true); phone2.setAuto(true); }
    else if (stage2) stage2.style.display = "none";

    const nav = root.querySelector<HTMLElement>(".lp-nav");
    const showcaseEl = root.querySelector<HTMLElement>(".showcase");
    const featureEls = [...root.querySelectorAll<HTMLElement>(".feature")];
    const finalEl = root.querySelector<HTMLElement>(".final-cta");

    const onScroll = () => {
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);

      if (phone2 && stage2 && finalEl) {
        const vis = finalEl.getBoundingClientRect().top < window.innerHeight * 0.55;
        stage2.classList.toggle("is-hidden", !vis);
      }

      if (phone) {
        const end = showcaseEl ? showcaseEl.offsetTop : document.body.scrollHeight;
        phone.setScroll(Math.min(1, window.scrollY / Math.max(1, end)));
      }

      if (phone && featureEls.length) {
        const sY = window.scrollY, vh = window.innerHeight;
        const c = featureEls.map((f) => { const r = f.getBoundingClientRect(); return r.top + sY + r.height / 2; });
        const secTop = c[0] - featureEls[0].getBoundingClientRect().height / 2;
        const y = sY + vh / 2;
        if (sY + vh * 0.55 < secTop) {
          phone.setAuto(true);
        } else {
          phone.setAuto(false);
          const lastC = c[c.length - 1];
          if (y >= lastC) {
            const scTop = showcaseEl ? showcaseEl.getBoundingClientRect().top + sY : document.body.scrollHeight;
            const span = Math.max(1, scTop - lastC);
            const extra = Math.min(1, Math.max(0, (y - lastC) / span)) * 2.0;
            phone.setFeatureProgress(c.length - 1 + extra);
          } else {
            let fp = 0;
            if (y <= c[0]) fp = 0;
            else for (let i = 0; i < c.length - 1; i++) { if (y >= c[i] && y < c[i + 1]) { fp = i + (y - c[i]) / (c[i + 1] - c[i]); break; } }
            phone.setFeatureProgress(fp);
          }
        }
      }

      if (phone && stage && showcaseEl) {
        const showcaseTop = showcaseEl.getBoundingClientRect().top;
        stage.classList.toggle("is-hidden", showcaseTop < window.innerHeight * 0.45);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    let grabObs: IntersectionObserver | null = null;
    const featuresEl = root.querySelector(".features");
    if (phone && featuresEl) {
      grabObs = new IntersectionObserver((es) => es.forEach((e) => phone!.grab(e.isIntersecting)), { threshold: 0.1 });
      grabObs.observe(featuresEl);
    }

    const reveal = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); } });
    }, { threshold: 0.15 });
    root.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));
    root.querySelectorAll(".plan").forEach((el) => { el.classList.add("reveal"); reveal.observe(el); });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      grabObs?.disconnect();
      reveal.disconnect();
      phone?.dispose();
      phone2?.dispose();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAuthOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const t = rootRef.current?.querySelector<HTMLElement>(id);
    if (t) window.scrollTo({ top: t.offsetTop - 60, behavior: "smooth" });
  };

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setMsg({ kind: "error", text: "Enter your email and password." }); return; }
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      } else {
        if (password.length < 8) { setMsg({ kind: "error", text: "Use at least 8 characters." }); setBusy(false); return; }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMsg({ kind: "ok", text: "Check your email to confirm your account." });
      }
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message || "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  const authTitle = authMode === "premium" ? "Go Premium" : authMode === "signup" ? "Create your account" : "Welcome back";
  const authCta = busy ? "…" : authMode === "premium" ? "Start 7-day trial" : authMode === "signup" ? "Create account" : "Sign in";

  return (
    <div className="lp-root" ref={rootRef}>
      <div id="phone-stage"><canvas id="phone-canvas" ref={canvasRef} /></div>

      <nav className="lp-nav">
        <a className="lp-brand" href="#top" onClick={scrollTo("#top")}>
          <img src="/bodytracker-icon.png" alt="BodyTrack:AI" />
          <span className="wm">BodyTrack<b>:AI</b></span>
        </a>
        <div className="lp-nav-links">
          <a href="#features" onClick={scrollTo("#features")}>Features</a>
          <a href="#showcase" onClick={scrollTo("#showcase")}>Tracking</a>
          <a href="#pricing" onClick={scrollTo("#pricing")}>Pricing</a>
        </div>
        <div className="lp-nav-cta">
          <button className="btn btn-ghost" onClick={() => openAuth("signin")}>Sign in</button>
          <button className="btn btn-primary" onClick={() => openAuth("signup")}>Start free</button>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-inner">
          <span className="eyebrow">Compatible with iOS &amp; Web</span>
          <h1>One honest readout of your <span className="glow">entire physiology</span>.</h1>
          <p className="lp-sub">The performance OS for serious physique athletes. Macros, training, bloodwork, and protocols — every input and output in one trustworthy place, read by an AI that knows your whole history.</p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={() => openAuth("signup")}>Start tracking free</button>
            <button className="btn btn-ghost btn-lg" onClick={() => openAuth("premium")}>Go Premium</button>
          </div>
          <div className="hero-stats">
            <div className="stat"><div className="n">225+</div><div className="l">Exercises</div></div>
            <div className="stat"><div className="n">5</div><div className="l">Systems tracked</div></div>
            <div className="stat"><div className="n">1</div><div className="l">Source of truth</div></div>
          </div>
        </div>
        <div className="scroll-cue"><div className="mouse" />Scroll</div>
      </header>

      <section className="features" id="features">
        {FEATURES.map((f) => (
          <div className="feature" data-side={f.side} key={f.num}>
            <div className="feature-copy">
              <span className="fnum">{f.num}</span>
              <div className="ficon" style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: f.icon }} />
              <h3>{f.title}</h3>
              <p>{f.copy}</p>
              <ul>{f.bullets.map((b) => <li key={b}><span className="dot" />{b}</li>)}</ul>
            </div>
          </div>
        ))}
      </section>

      <section className="showcase" id="showcase">
        <div className="showcase-head reveal">
          <span className="eyebrow">Everything you track</span>
          <h2 className="lp-h2">One app. The whole stack.</h2>
        </div>
        <div className="snap-rail">
          {SHOWCASE.map((s) => (
            <article className="snap-card" key={s.title}>
              <div className="sc-vis" dangerouslySetInnerHTML={{ __html: s.vis }} />
              <div className="sc-tag">{s.tag}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </article>
          ))}
        </div>
        <div className="rail-hint"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7h10M9 4l3 3-3 3" /></svg> Drag or scroll →</div>
      </section>

      <section className="pricing" id="pricing">
        <div className="pricing-head reveal">
          <span className="eyebrow">Pricing</span>
          <h2 className="lp-h2">Track free. Go further with Premium.</h2>
          <p className="lp-sub">Everything to log your stack is free. Premium unlocks the AI that turns your data into decisions.</p>
        </div>
        <div className="plans">
          <div className="plan">
            <div className="pname">Free</div>
            <div className="price">$0<small> / forever</small></div>
            <div className="pdesc">The complete tracking stack.</div>
            <ul>
              <li><span dangerouslySetInnerHTML={{ __html: check }} />Nutrition, training &amp; compound logs</li>
              <li><span dangerouslySetInnerHTML={{ __html: check }} />Bloodwork &amp; vitals tracking</li>
              <li><span dangerouslySetInnerHTML={{ __html: check }} />225+ exercise library</li>
              <li className="off"><span dangerouslySetInnerHTML={{ __html: cross }} />AI coach &amp; analysis</li>
            </ul>
            <button className="btn btn-ghost" onClick={() => openAuth("signup")}>Create free account</button>
          </div>
          <div className="plan featured">
            <div className="pname">Premium</div>
            <div className="price">$12<small> / month</small></div>
            <div className="pdesc">Your data, turned into decisions.</div>
            <ul>
              <li><span dangerouslySetInnerHTML={{ __html: checkBlue }} />Everything in Free</li>
              <li><span dangerouslySetInnerHTML={{ __html: checkBlue }} />AI coach with full-history context</li>
              <li><span dangerouslySetInnerHTML={{ __html: checkBlue }} />AI meal-plan &amp; program builders</li>
              <li><span dangerouslySetInnerHTML={{ __html: checkBlue }} />AI bloodwork analysis &amp; reviews</li>
            </ul>
            <button className="btn btn-primary" onClick={() => openAuth("premium")}>Start 7-day free trial</button>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="glowbg" />
        <div id="phone-stage-2"><canvas id="phone-canvas-2" ref={canvas2Ref} /></div>
        <h2>Stop guessing.<br />Start reading your numbers.</h2>
        <p className="lp-sub">Join the athletes who make every call — eat more, run the cycle, retest bloods, deload — backed by their own data.</p>
        <div className="hero-cta">
          <button className="btn btn-primary btn-lg" onClick={() => openAuth("signup")}>Start tracking free</button>
          <button className="btn btn-mint btn-lg" onClick={() => openAuth("premium")}>Go Premium</button>
        </div>
      </section>

      <footer className="lp-footer">
        <a className="lp-brand" href="#top" onClick={scrollTo("#top")}>
          <img src="/bodytracker-icon.png" alt="" style={{ width: 24, height: 24 }} />
          <span className="wm">BodyTrack<b style={{ color: "var(--accent-bright)" }}>:AI</b></span>
        </a>
        <span>© 2026 BodyTrack:AI · Vital Signal · The performance OS for serious physique athletes.</span>
      </footer>

      <div className={`auth-modal${authOpen ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setAuthOpen(false); }}>
        <form className="auth-card" style={{ position: "relative" }} onSubmit={submitAuth}>
          <button type="button" className="auth-close" onClick={() => setAuthOpen(false)} aria-label="Close">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
          </button>
          <h3>{authTitle}</h3>
          <p className="sub">Your full physiology, one trustworthy place.</p>
          {authMode === "premium" && (
            <div className="auth-prem" style={{ display: "flex" }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 13l2-8 4 5 4-7 4 7 2-2" /></svg>
              7-day free trial · then $12/mo · cancel anytime
            </div>
          )}
          <div className="auth-field"><label>Email</label><input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
          <div className="auth-field"><label>Password</label><input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={authMode === "signin" ? "current-password" : "new-password"} /></div>
          {msg && (
            <div style={{ fontSize: 13, marginBottom: 10, color: msg.kind === "error" ? "#f56565" : "#2fe3a8", fontFamily: "var(--font-mono)" }}>{msg.text}</div>
          )}
          <button type="submit" className="btn btn-primary" disabled={busy}>{authCta}</button>
          <div className="auth-alt">
            {authMode === "signin" ? (
              <>New here? <a onClick={() => { setAuthMode("signup"); setMsg(null); }}>Create an account</a></>
            ) : (
              <>Already have an account? <a onClick={() => { setAuthMode("signin"); setMsg(null); }}>Sign in</a></>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

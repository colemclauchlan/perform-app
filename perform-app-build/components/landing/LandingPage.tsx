import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { HeroBackdrop } from "@/components/visual/HeroBackdrop";
import { Reveal, Stagger, StaggerItem } from "@/components/visual/Motion";
import {
  Utensils,
  Dumbbell,
  Ruler,
  FlaskConical,
  Syringe,
  Sparkles,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Check,
  TrendingUp,
  Activity,
} from "lucide-react";

const FEATURES = [
  {
    icon: Utensils,
    title: "Nutrition & Macros",
    desc: "Log food against calorie and macro targets with a searchable catalog, custom foods, and per-meal breakdowns.",
    tint: "#f6ad55",
  },
  {
    icon: Dumbbell,
    title: "Training & Progression",
    desc: "Build workouts, track every set, and watch estimated 1RM and weekly tonnage trend over time.",
    tint: "#3b82f6",
  },
  {
    icon: Ruler,
    title: "Body Metrics",
    desc: "Bodyweight, measurements, body-fat, sleep, hydration, and steps — all charted in one place.",
    tint: "#2dd4bf",
  },
  {
    icon: FlaskConical,
    title: "Bloodwork",
    desc: "Record lab markers with custom panels and spot trends in your hormones, lipids, and organ health.",
    tint: "#fc8181",
  },
  {
    icon: Syringe,
    title: "Compound Protocols",
    desc: "Plan and log peptide and PED protocols with dosing schedules, half-life math, and a dose calculator.",
    tint: "#7c5cff",
  },
  {
    icon: Sparkles,
    title: "AI Coach",
    desc: "An IFBB-level coach that reads your data and gives direct, actionable training, nutrition, and recovery guidance.",
    tint: "#22d3a5",
  },
];

const STATS = [
  { label: "Calories today", value: "2,340", sub: "of 2,600", tone: "text-status-amber" },
  { label: "Protein", value: "186g", sub: "goal hit", tone: "text-status-green" },
  { label: "Weekly tonnage", value: "48.2k", sub: "+6% vs last", tone: "text-accent-bright" },
  { label: "Sleep avg", value: "7.6h", sub: "last 14 nights", tone: "text-status-teal" },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 glass">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo variant="full" size={30} className="rounded-lg" />
          <nav className="flex items-center gap-2">
            <Link href="/auth/login" className="btn btn-ghost btn-sm">
              Log in
            </Link>
            <Link href="/auth/login" className="btn btn-primary btn-sm">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative">
        {/* Hero */}
        <section className="relative">
          <HeroBackdrop />
          <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-12 sm:pt-24 sm:pb-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-bg-2/60 backdrop-blur-md text-[12px] text-text-2 mb-6 animate-fade-in">
              <Smartphone size={13} className="text-accent" />
              One synced dashboard · Web &amp; iOS
            </div>

            <h1 className="font-display text-[2.6rem] sm:text-7xl font-bold tracking-tight leading-[1.02] mb-5 animate-fade-in">
              Track your physique
              <br className="hidden sm:block" />{" "}
              <span className="text-brand">like a pro.</span>
            </h1>

            <p className="text-text-2 text-base sm:text-lg max-w-2xl mx-auto mb-8 selectable">
              BodyTracker brings nutrition, training, body metrics, bloodwork, and
              compound protocols into a single performance dashboard — with an AI
              coach that actually reads your data.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <Link
                href="/auth/login"
                className="btn btn-primary group w-full sm:w-auto px-6 py-3 text-base"
              >
                <span className="shine-overlay" />
                Start tracking free
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth/login"
                className="btn btn-ghost w-full sm:w-auto px-6 py-3 text-base backdrop-blur-md"
              >
                Log in
              </Link>
            </div>
            <p className="text-text-3 text-xs flex items-center justify-center gap-1.5">
              <ShieldCheck size={13} /> Private &amp; secure — your data is yours.
            </p>

            {/* Hero video — framed product showcase with a subtle 3D tilt */}
            <Reveal delay={0.1} className="mt-14 [perspective:1600px]">
              <div className="relative mx-auto max-w-4xl">
                <div className="absolute -inset-6 -z-10 bg-brand-gradient opacity-25 blur-3xl rounded-[2rem]" />
                <div className="panel hairline-top p-2 sm:p-2.5 transition-transform duration-500 will-change-transform sm:[transform:rotateX(7deg)] sm:hover:[transform:rotateX(0deg)]">
                  <div className="relative overflow-hidden rounded-xl bg-bg-0">
                    <video
                      className="w-full h-auto block"
                      autoPlay
                      muted
                      loop
                      playsInline
                      poster="/bodytracker-logo.png"
                    >
                      <source src="/bodytracker-hero.mp4" type="video/mp4" />
                    </video>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Compact live-stat strip */}
            <Stagger className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {STATS.map((s) => (
                <StaggerItem key={s.label}>
                  <div className="stat-card text-left h-full">
                    <div className="text-[11px] text-text-3 mb-1">{s.label}</div>
                    <div className="text-2xl font-bold tabular-nums font-display">{s.value}</div>
                    <div className={`text-[11px] mt-0.5 ${s.tone}`}>{s.sub}</div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-5 py-16">
          <Reveal className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-dim text-accent text-[12px] font-medium mb-4">
              Everything in one place
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">
              Everything you train for, in one place
            </h2>
            <p className="text-text-2 max-w-xl mx-auto selectable">
              Stop juggling five apps and a spreadsheet. Every metric that moves
              your physique lives here.
            </p>
          </Reveal>

          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <StaggerItem key={f.title}>
                <div className="card card-hover group h-full">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{
                      background: `${f.tint}1a`,
                      color: f.tint,
                      boxShadow: `inset 0 0 0 1px ${f.tint}33`,
                    }}
                  >
                    <f.icon size={20} />
                  </div>
                  <h3 className="font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-sm text-text-2 leading-relaxed selectable">
                    {f.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* AI Coach highlight */}
        <section className="max-w-6xl mx-auto px-5 py-14">
          <Reveal>
            <div className="panel p-6 sm:p-8">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-dim text-accent text-[12px] font-medium mb-4">
                    <Sparkles size={13} /> AI Coach
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                    A coach that reads your numbers
                  </h2>
                  <p className="text-text-2 mb-5 selectable">
                    Trained as an IFBB-level coach, sports nutritionist, and PED
                    consultant. It pulls your lifts, macros, bodyweight, and
                    protocols, then gives direct, data-driven adjustments — no
                    fluff.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "Builds bulking, cutting, recomp, and contest-prep plans",
                      "Programs training splits with sets, reps, and progression",
                      "Interprets bloodwork trends and flags concerns",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-sm">
                        <span className="w-5 h-5 rounded-full bg-status-green/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={12} className="text-status-green" />
                        </span>
                        <span className="text-text-1 selectable">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Faux chat bubble */}
                <div className="bg-bg-2/80 border border-border rounded-2xl p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-accent-gradient flex items-center justify-center">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold">Coach</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="bg-bg-3 rounded-xl rounded-tl-sm px-3 py-2 text-text-1 selectable">
                      Protein&apos;s been under target 4 of 7 days and your bench
                      e1RM stalled.
                    </p>
                    <p className="bg-accent-dim border border-accent/20 rounded-xl rounded-tl-sm px-3 py-2 text-text-1 selectable">
                      <strong>Recommendation:</strong> add 40g protein on training
                      days and run a deload week — your tonnage is up 18% with no
                      recovery dip yet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Trust strip */}
        <section className="max-w-6xl mx-auto px-5 py-6">
          <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, t: "Trend-first", d: "Every metric charted over time, not just logged." },
              { icon: Smartphone, t: "Web + iOS", d: "Same account, same data, synced everywhere." },
              { icon: Activity, t: "Apple Health", d: "Sync steps, weight, and sleep on the iOS app." },
            ].map((x) => (
              <StaggerItem key={x.t}>
                <div className="flex items-center gap-3 card h-full">
                  <div className="w-10 h-10 rounded-xl bg-accent-dim flex items-center justify-center flex-shrink-0">
                    <x.icon size={18} className="text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{x.t}</div>
                    <div className="text-xs text-text-2 selectable">{x.d}</div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Final CTA */}
        <section className="max-w-6xl mx-auto px-5 py-16">
          <Reveal>
            <div className="panel aurora-bg px-6 py-12 sm:py-16 text-center">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-3">
                Start tracking <span className="text-brand">today</span>
              </h2>
              <p className="text-text-2 max-w-md mx-auto mb-7 selectable">
                Create your free account and bring your whole physique into one
                dashboard.
              </p>
              <Link
                href="/auth/login"
                className="btn btn-primary group px-7 py-3 text-base"
              >
                <span className="shine-overlay" />
                Get started
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo variant="full" size={24} className="rounded-md opacity-90" />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-text-2">
            <Link href="/auth/login" className="hover:text-text-1 transition-colors">
              Log in
            </Link>
            <Link href="/privacy" className="hover:text-text-1 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-text-1 transition-colors">
              Terms
            </Link>
            <Link href="/support" className="hover:text-text-1 transition-colors">
              Support
            </Link>
          </div>
          <div className="text-xs text-text-3">
            © {new Date().getFullYear()} BodyTracker
          </div>
        </div>
      </footer>
    </div>
  );
}

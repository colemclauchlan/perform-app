import { Button } from "@/components/vital/Button";
import { Card } from "@/components/vital/Card";
import { Plus, Syringe, Activity, FlaskConical, Trash2, ArrowRight } from "lucide-react";

export const metadata = { title: "Vital Signal — Design System", robots: { index: false } };

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--text-3)",
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function Swatch({ name, value, hex }: { name: string; value: string; hex: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          height: 56,
          borderRadius: "var(--r-md)",
          background: value,
          border: "1px solid var(--line)",
        }}
      />
      <div style={{ marginTop: 8, fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--text-1)" }}>{name}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.02em" }}>{hex}</div>
    </div>
  );
}

const SECTION: React.CSSProperties = { marginTop: 56 };
const GRID6: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 16 };

export default function DesignSystemPreview() {
  return (
    <div className="vital-signal" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 24px 96px" }}>
        {/* ── Brand header ── */}
        <header style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vital-signal/logo-mark.svg" alt="BodyTrack:AI" width={56} height={56} />
          <div>
            <div
              className="vs-display"
              style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.04 }}
            >
              BodyTrack:AI
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent-bright)", marginTop: 4 }}>
              Vital Signal · REV 1.0
            </div>
          </div>
        </header>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: 17, color: "var(--text-2)", marginTop: 20, maxWidth: 560 }}>
          Track the body. Trust the signal. — ported tokens + the first two components, for a fidelity check
          before the rest of the system is built.
        </p>

        {/* ── Palette ── */}
        <section style={SECTION}>
          <Eyebrow>Palette — Brand</Eyebrow>
          <div style={GRID6}>
            <Swatch name="Pulse Blue" value="var(--pulse-blue)" hex="#189BF5" />
            <Swatch name="Deep Royal" value="var(--deep-royal)" hex="#1346D8" />
            <Swatch name="Vital Mint" value="var(--vital-mint)" hex="#2FE3A8" />
            <Swatch name="Steel" value="var(--steel)" hex="#9FB0C0" />
            <Swatch name="Bone" value="var(--bone)" hex="#EEF3F8" />
            <Swatch name="Ink" value="var(--ink)" hex="#0C1422" />
          </div>

          <Eyebrow>{<span style={{ display: "block", marginTop: 32 }}>Surfaces & hairlines</span>}</Eyebrow>
          <div style={GRID6}>
            <Swatch name="Void" value="var(--void)" hex="#0E1623" />
            <Swatch name="Surface 0" value="var(--surface-0)" hex="#131D2C" />
            <Swatch name="Surface 1" value="var(--surface-1)" hex="#1A2433" />
            <Swatch name="Surface 2" value="var(--surface-2)" hex="#1F2B3C" />
            <Swatch name="Surface 3" value="var(--surface-3)" hex="#27344A" />
            <Swatch name="Line" value="var(--line)" hex="#2D3E58" />
          </div>

          <Eyebrow>{<span style={{ display: "block", marginTop: 32 }}>Status & signal</span>}</Eyebrow>
          <div style={GRID6}>
            <Swatch name="On-track" value="var(--ok)" hex="#2FE3A8" />
            <Swatch name="Due soon" value="var(--warn)" hex="#F6AD55" />
            <Swatch name="Overdue" value="var(--high)" hex="#F56565" />
            <Swatch name="Info" value="var(--info)" hex="#63B3ED" />
            <Swatch name="Current" value="var(--grad-current)" hex="blue → royal" />
            <Swatch name="Steel" value="var(--grad-steel)" hex="brushed metal" />
          </div>
        </section>

        {/* ── Type ── */}
        <section style={SECTION}>
          <Eyebrow>Type — three registers</Eyebrow>
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                Space Grotesk · display + big numbers
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.04, color: "var(--text-1)" }}>
                Track the body.
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                Outfit · interface + body
              </div>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 17, color: "var(--text-2)", lineHeight: 1.5, maxWidth: 560 }}>
                The performance OS for serious physique athletes — macros, training, bloodwork and protocols in one
                trustworthy place.
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                Geist Mono · data, timers, IDs
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: 22, color: "var(--text-1)", letterSpacing: "0.02em" }}>
                212g / 200g · 106% · e1RM 142.5kg · Overdue 4h 12m · BTAI-0427
              </div>
            </div>
          </div>
        </section>

        {/* ── Button ── */}
        <section style={SECTION}>
          <Eyebrow>Component — Button</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <Button variant="primary" icon={<Plus size={16} />}>New Protocol</Button>
            <Button variant="ghost" icon={<Syringe size={16} />}>Log Dose</Button>
            <Button variant="mint" icon={<Activity size={16} />}>On-track</Button>
            <Button variant="danger" icon={<Trash2 size={14} />} size="sm">Delete</Button>
            <Button variant="primary" disabled icon={<FlaskConical size={16} />}>Disabled</Button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 16 }}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg" iconRight={<ArrowRight size={18} />}>Large</Button>
          </div>
        </section>

        {/* ── Card ── */}
        <section style={SECTION}>
          <Eyebrow>Component — Card</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <Card title="Today's Macros" action={<Button variant="ghost" size="sm">Edit</Button>}>
              <div style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: 28, color: "var(--text-1)" }}>
                2,140 <span style={{ color: "var(--text-3)", fontSize: 16 }}>/ 2,500 kcal</span>
              </div>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--text-2)", marginTop: 6 }}>
                212g protein · 106% of goal
              </div>
            </Card>

            <Card title="Active Protocols" action={<span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--accent-bright)" }}>Manage →</span>}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--text-2)" }}>
                Test E · HCG · Anastrozole
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--high)", marginTop: 8 }}>2 doses overdue</div>
            </Card>

            <Card interactive>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--text-1)", fontWeight: 600 }}>Interactive card</div>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
                Hover lifts the border and adds a soft blue glow.
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

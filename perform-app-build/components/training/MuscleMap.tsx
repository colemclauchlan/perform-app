"use client";

// Schematic front/back body map that highlights the muscles an exercise targets.
// Primary muscle = strong accent + pulse; secondary = softer fill.

type Level = "primary" | "secondary" | "off";

const PRIMARY = "#2fe3a8";
const SECONDARY = "#189bf5";
const OFF = "rgba(255,255,255,0.06)";
const STROKE = "rgba(255,255,255,0.14)";

// Region keys used by the SVG shapes.
type Region =
  | "traps" | "chest" | "shoulders" | "biceps" | "triceps" | "forearms"
  | "abs" | "obliques" | "lats" | "lowerback" | "glutes"
  | "quads" | "hamstrings" | "calves";

// Map a free-text muscle name to one or more regions.
function regionsFor(name: string): Region[] {
  const n = name.toLowerCase();
  const out: Region[] = [];
  const add = (r: Region) => { if (!out.includes(r)) out.push(r); };
  if (/trap/.test(n)) add("traps");
  if (/chest|pec/.test(n)) add("chest");
  if (/shoulder|delt/.test(n)) add("shoulders");
  if (/bicep/.test(n)) add("biceps");
  if (/tricep/.test(n)) add("triceps");
  if (/forearm|grip|brach-?/.test(n)) add("forearms");
  if (/ab|core|rectus/.test(n)) add("abs");
  if (/oblique/.test(n)) add("obliques");
  if (/lat|back|rhomboid|teres/.test(n)) add("lats");
  if (/lower back|erector|spinal/.test(n)) add("lowerback");
  if (/glute|hip/.test(n)) add("glutes");
  if (/quad|leg|thigh|hip flexor|adductor/.test(n)) add("quads");
  if (/hamstring/.test(n)) add("hamstrings");
  if (/calf|calves|soleus|gastro/.test(n)) add("calves");
  if (/full body/.test(n)) ["chest","shoulders","abs","quads","lats","glutes"].forEach((r) => add(r as Region));
  return out;
}

function buildLevels(primary: string, secondary: string[]): Record<Region, Level> {
  const levels = {} as Record<Region, Level>;
  (["traps","chest","shoulders","biceps","triceps","forearms","abs","obliques","lats","lowerback","glutes","quads","hamstrings","calves"] as Region[])
    .forEach((r) => (levels[r] = "off"));
  secondary.forEach((m) => regionsFor(m).forEach((r) => { if (levels[r] === "off") levels[r] = "secondary"; }));
  regionsFor(primary).forEach((r) => (levels[r] = "primary"));
  return levels;
}

function fill(level: Level) {
  return level === "primary" ? PRIMARY : level === "secondary" ? SECONDARY : OFF;
}

function Part({ level, children }: { level: Level; children: React.ReactNode }) {
  return (
    <g
      fill={fill(level)}
      stroke={STROKE}
      strokeWidth={0.6}
      style={level === "primary" ? { animation: "musclePulse 1.6s ease-in-out infinite" } : undefined}
    >
      {children}
    </g>
  );
}

export function MuscleMap({
  primary,
  secondary = [],
}: {
  primary: string;
  secondary?: string[];
}) {
  const L = buildLevels(primary, secondary);

  return (
    <div className="flex items-center justify-center gap-6 py-2">
      <style>{`@keyframes musclePulse{0%,100%{opacity:.65}50%{opacity:1}}`}</style>

      {/* FRONT */}
      <figure className="text-center">
        <svg viewBox="0 0 100 200" className="h-48 w-auto">
          {/* silhouette */}
          <g fill="rgba(255,255,255,0.03)" stroke={STROKE} strokeWidth={0.8}>
            <circle cx="50" cy="13" r="9" />
            <path d="M33 24 Q50 20 67 24 L72 70 Q72 78 66 86 L62 120 Q60 128 56 128 L44 128 Q40 128 38 120 L34 86 Q28 78 28 70 Z" />
            <path d="M44 128 L40 196 L48 196 L50 140 L52 196 L60 196 L56 128 Z" />
            <path d="M33 26 L22 74 L28 76 L37 34 Z" />
            <path d="M67 26 L78 74 L72 76 L63 34 Z" />
          </g>
          {/* traps */}
          <Part level={L.traps}><path d="M40 24 Q50 21 60 24 L58 30 Q50 27 42 30 Z" /></Part>
          {/* shoulders */}
          <Part level={L.shoulders}><circle cx="31" cy="30" r="6" /><circle cx="69" cy="30" r="6" /></Part>
          {/* chest */}
          <Part level={L.chest}><path d="M38 32 L49 32 L49 48 Q43 50 38 46 Z" /><path d="M51 32 L62 32 L62 46 Q57 50 51 48 Z" /></Part>
          {/* biceps */}
          <Part level={L.biceps}><ellipse cx="28" cy="48" rx="4" ry="9" /><ellipse cx="72" cy="48" rx="4" ry="9" /></Part>
          {/* forearms */}
          <Part level={L.forearms}><ellipse cx="24" cy="66" rx="3.5" ry="9" /><ellipse cx="76" cy="66" rx="3.5" ry="9" /></Part>
          {/* abs */}
          <Part level={L.abs}><rect x="44" y="52" width="12" height="26" rx="3" /></Part>
          {/* obliques */}
          <Part level={L.obliques}><path d="M39 54 L43 54 L43 74 L40 70 Z" /><path d="M61 54 L57 54 L57 74 L60 70 Z" /></Part>
          {/* quads */}
          <Part level={L.quads}><path d="M41 90 L47 90 L46 132 L42 132 Z" /><path d="M53 90 L59 90 L58 132 L54 132 Z" /></Part>
          {/* calves (front shin) */}
          <Part level={L.calves}><ellipse cx="44" cy="160" rx="3" ry="12" /><ellipse cx="56" cy="160" rx="3" ry="12" /></Part>
        </svg>
        <figcaption className="text-[9px] uppercase tracking-widest text-text-3 mt-1">Front</figcaption>
      </figure>

      {/* BACK */}
      <figure className="text-center">
        <svg viewBox="0 0 100 200" className="h-48 w-auto">
          <g fill="rgba(255,255,255,0.03)" stroke={STROKE} strokeWidth={0.8}>
            <circle cx="50" cy="13" r="9" />
            <path d="M33 24 Q50 20 67 24 L72 70 Q72 78 66 86 L62 120 Q60 128 56 128 L44 128 Q40 128 38 120 L34 86 Q28 78 28 70 Z" />
            <path d="M44 128 L40 196 L48 196 L50 140 L52 196 L60 196 L56 128 Z" />
            <path d="M33 26 L22 74 L28 76 L37 34 Z" />
            <path d="M67 26 L78 74 L72 76 L63 34 Z" />
          </g>
          {/* traps */}
          <Part level={L.traps}><path d="M40 23 Q50 20 60 23 L56 38 Q50 34 44 38 Z" /></Part>
          {/* shoulders rear */}
          <Part level={L.shoulders}><circle cx="31" cy="30" r="6" /><circle cx="69" cy="30" r="6" /></Part>
          {/* lats */}
          <Part level={L.lats}><path d="M38 38 L48 40 L46 70 L36 60 Z" /><path d="M62 38 L52 40 L54 70 L64 60 Z" /></Part>
          {/* triceps */}
          <Part level={L.triceps}><ellipse cx="28" cy="48" rx="4" ry="9" /><ellipse cx="72" cy="48" rx="4" ry="9" /></Part>
          {/* forearms */}
          <Part level={L.forearms}><ellipse cx="24" cy="66" rx="3.5" ry="9" /><ellipse cx="76" cy="66" rx="3.5" ry="9" /></Part>
          {/* lower back */}
          <Part level={L.lowerback}><rect x="44" y="64" width="12" height="16" rx="3" /></Part>
          {/* glutes */}
          <Part level={L.glutes}><path d="M40 86 Q44 84 49 86 L49 100 Q44 102 40 98 Z" /><path d="M60 86 Q56 84 51 86 L51 100 Q56 102 60 98 Z" /></Part>
          {/* hamstrings */}
          <Part level={L.hamstrings}><path d="M41 104 L47 104 L46 130 L42 130 Z" /><path d="M53 104 L59 104 L58 130 L54 130 Z" /></Part>
          {/* calves (back) */}
          <Part level={L.calves}><ellipse cx="44" cy="158" rx="3.5" ry="13" /><ellipse cx="56" cy="158" rx="3.5" ry="13" /></Part>
        </svg>
        <figcaption className="text-[9px] uppercase tracking-widest text-text-3 mt-1">Back</figcaption>
      </figure>
    </div>
  );
}

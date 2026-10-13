import type { CSSProperties } from "react";
import { LogoTile } from "../Icon";

/*
 * "What changes" — one picture for each idea in the list beside it.
 *   0  Beyond a number on the scale  → a scale reading steps aside; the pattern behind it appears
 *   1  Seven biological domains      → seven domains around one core, joined
 *   2  Deterministic scores          → inputs → fixed rules → a score; the AI only explains it
 *   3  Your report                   → a page with nineteen section tabs and its limitations
 *   4  Private by design             → a shield with access, versions and an audit trail
 *   5  Educational, not diagnostic   → a conversation, and the next steps as stepping stones
 * Drawing only: the words live in the list beside it.
 */

const d = (i: number, step = 0.12, base = 0) => ({ animationDelay: `${(base + i * step).toFixed(2)}s` }) as CSSProperties;

/* 0 — the pattern behind the number */
const PAT: Array<[number, number]> = [
  [248, 84],
  [300, 60],
  [350, 98],
  [290, 124],
  [238, 142],
  [336, 168],
  [284, 198],
  [232, 218],
  [350, 236],
];
const PAT_EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [0, 3],
  [1, 3],
  [2, 3],
  [3, 4],
  [3, 5],
  [4, 6],
  [5, 6],
  [6, 7],
  [6, 8],
  [5, 8],
  [4, 7],
  [0, 4],
];

/* 1 — the seven domains, with the codes the hero uses */
const DOMAINS = ["MR", "HS", "SR", "CH", "SL", "IB", "BS"];
const RING = DOMAINS.map((code, i) => {
  const a = ((-90 + (i * 360) / DOMAINS.length) * Math.PI) / 180;
  return { code, x: +(210 + 108 * Math.cos(a)).toFixed(1), y: +(170 + 108 * Math.sin(a)).toFixed(1) };
});

/* 2 — inputs on the left */
const INPUTS = [58, 40, 66, 48, 62, 36];

/* 3 — nineteen section tabs */
const TABS = Array.from({ length: 19 }, (_, i) => i);

/* 5 — stepping stones */
const STONES: Array<[number, number]> = [
  [62, 296],
  [122, 280],
  [186, 296],
  [250, 268],
  [318, 276],
];

export default function ChangeStage({ active }: { active: number }) {
  const on = (i: number) => `cs-scene${active === i ? " on" : ""}`;
  return (
    <div className="wc-vis-wrap">
      <div className="wc-mark">
        <LogoTile size="sm" />
      </div>
      <svg viewBox="0 0 420 340" fill="none" className="cs-svg" data-a={active}>
        {/* 0 · beyond a number on the scale */}
        <g className={`${on(0)} s0`}>
          <g className="cs-pattern">
            <ellipse cx="294" cy="152" rx="104" ry="116" className="cs-halo" />
            {PAT_EDGES.map(([a, b], i) => (
              <path key={i} d={`M${PAT[a][0]} ${PAT[a][1]} L${PAT[b][0]} ${PAT[b][1]}`} className="cs-edge" style={d(i, 0.07, 0.5)} />
            ))}
            {PAT.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i === 3 || i === 6 ? 9 : 6} className={`cs-node${i === 3 || i === 6 ? " cs-node-big" : ""}`} style={d(i, 0.08, 0.6)} />
            ))}
          </g>
          <g className="cs-scale">
            <rect x="46" y="190" width="128" height="94" rx="24" className="cs-body" />
            <rect x="72" y="208" width="76" height="34" rx="11" className="cs-screen" />
            <text x="110" y="232" textAnchor="middle" className="cs-digits">
              73.9
            </text>
            <path d="M82 262 H138" className="cs-line cs-faint" />
            <circle cx="62" cy="276" r="3" className="cs-dotw" />
            <circle cx="158" cy="276" r="3" className="cs-dotw" />
          </g>
        </g>

        {/* 1 · seven connected domains */}
        <g className={`${on(1)} s1`}>
          <circle cx="210" cy="170" r="136" className="cs-orbit" />
          {RING.map((p, i) => (
            <path key={i} d={`M210 170 L${p.x} ${p.y}`} className="cs-edge cs-edge-strong" style={d(i, 0.1, 0.1)} />
          ))}
          <path
            d={`M${RING.map((p) => `${p.x} ${p.y}`).join(" L")} Z`}
            className="cs-weave"
          />
          <circle cx="210" cy="170" r="30" className="cs-core" />
          <circle cx="210" cy="170" r="18" className="cs-core-in" />
          {RING.map((p, i) => (
            <g key={p.code} className="cs-domain" style={d(i, 0.14, 0.3)}>
              <circle cx={p.x} cy={p.y} r="19" className="cs-dom" />
              <text x={p.x} y={p.y + 3.5} textAnchor="middle" className="cs-code">
                {p.code}
              </text>
            </g>
          ))}
        </g>

        {/* 2 · deterministic scores: rules calculate, the AI only explains */}
        <g className={`${on(2)} s2`}>
          {INPUTS.map((w, i) => (
            <g key={i}>
              <rect x="26" y={86 + i * 26} width="76" height="9" rx="4.5" className="cs-track" />
              <rect x="26" y={86 + i * 26} width={w} height="9" rx="4.5" className="cs-input" style={d(i, 0.1)} />
              <path d={`M104 ${90.5 + i * 26} C124 ${90.5 + i * 26} 126 170 140 170`} className="cs-flow" style={d(i, 0.1, 0.4)} />
            </g>
          ))}
          <g className="cs-rules">
            <rect x="140" y="112" width="86" height="116" rx="18" className="cs-body" />
            <path d="M183 128 L203 148 L183 168 L163 148 Z" className="cs-line" />
            <path d="M183 168 V186 M183 186 H164 M183 186 H202" className="cs-line" />
            <rect x="156" y="190" width="16" height="16" rx="4" className="cs-solid" />
            <rect x="194" y="190" width="16" height="16" rx="4" className="cs-solid" />
          </g>
          <path d="M228 170 H262" className="cs-flow cs-flow-hard" />
          <path d="M256 163 L266 170 L256 177" className="cs-line" />
          <g className="cs-gauge">
            <path d="M276 214 A58 58 0 0 1 392 214" className="cs-gtrack" />
            <path d="M276 214 A58 58 0 0 1 392 214" className="cs-garc" pathLength="100" />
            <g className="cs-needle" style={{ transformOrigin: "334px 214px" }}>
              <path d="M334 214 L334 166" className="cs-nd" />
            </g>
            <circle cx="334" cy="214" r="6" className="cs-solid" />
            <text x="334" y="246" textAnchor="middle" className="cs-score">
              61
            </text>
          </g>
          <g className="cs-ai">
            <rect x="268" y="42" width="118" height="44" rx="14" className="cs-body" />
            <circle cx="286" cy="64" r="9" className="cs-aibadge" />
            <path d="M283 64 H289 M286 61 V67" className="cs-ailine" />
            <path d="M304 58 H372 M304 70 H352" className="cs-line cs-faint" />
            <path d="M334 88 V132" className="cs-explain" />
          </g>
        </g>

        {/* 3 · your report: nineteen sections, with its limitations */}
        <g className={`${on(3)} s3`}>
          <rect x="112" y="30" width="170" height="282" rx="16" className="cs-page" />
          <path d="M134 62 H226" className="cs-title" />
          <path d="M134 86 H258 M134 102 H258 M134 118 H220" className="cs-line cs-faint" />
          <circle cx="166" cy="170" r="24" className="cs-ring" />
          <path d="M166 146 A24 24 0 0 1 188 178" className="cs-ring-on" />
          <path d="M206 160 H258 M206 176 H246 M206 192 H258" className="cs-line cs-faint" />
          <rect x="134" y="236" width="126" height="48" rx="10" className="cs-limit" />
          <circle cx="152" cy="260" r="8" className="cs-solid" />
          <path d="M152 256 V261 M152 264 V264.5" className="cs-bang" />
          <path d="M170 254 H246 M170 266 H228" className="cs-line cs-faint" />
          {TABS.map((i) => (
            <rect key={i} x="290" y={32 + i * 14.4} width="16" height="9.4" rx="3" className="cs-tab" style={d(i, 0.22)} />
          ))}
          <path d="M282 60 C 292 60 290 38 290 38" className="cs-line cs-faint" />
        </g>

        {/* 4 · private by design: access, versions and an audit trail */}
        <g className={`${on(4)} s4`}>
          <circle cx="210" cy="164" r="132" className="cs-orbit cs-pulse" />
          <circle cx="210" cy="164" r="104" className="cs-orbit cs-pulse cs-p2" />
          <path
            d="M210 64 L282 92 V164 C282 208 250 240 210 256 C170 240 138 208 138 164 V92 Z"
            className="cs-shield"
          />
          <rect x="190" y="152" width="40" height="32" rx="8" className="cs-solid cs-lockbody" />
          <path d="M198 152 V142 A12 12 0 0 1 222 142 V152" className="cs-shackle" />
          <circle cx="210" cy="168" r="4" className="cs-keyhole" />
          {/* access */}
          <g className="cs-mod">
            <circle cx="62" cy="150" r="22" className="cs-body" />
            <circle cx="62" cy="144" r="6" className="cs-dotw" />
            <path d="M50 162 C52 154 72 154 74 162" className="cs-line" />
            <path d="M86 150 H134" className="cs-edge cs-edge-strong" />
          </g>
          {/* versions */}
          <g className="cs-mod cs-mod2">
            <rect x="334" y="124" width="52" height="40" rx="8" className="cs-ver cs-v3" />
            <rect x="328" y="134" width="52" height="40" rx="8" className="cs-ver cs-v2" />
            <rect x="322" y="144" width="52" height="40" rx="8" className="cs-ver cs-v1" />
            <text x="348" y="168" textAnchor="middle" className="cs-code">
              v3
            </text>
            <path d="M286 152 H318" className="cs-edge cs-edge-strong" />
          </g>
          {/* audit */}
          <g className="cs-mod cs-mod3">
            <rect x="132" y="274" width="156" height="50" rx="12" className="cs-body" />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <circle cx="150" cy={288 + i * 12} r="3.4" className="cs-check" style={d(i, 0.35, 0.4)} />
                <path d={`M162 ${288 + i * 12} H${252 - i * 20}`} className="cs-line cs-faint" />
              </g>
            ))}
          </g>
        </g>

        {/* 5 · educational, not diagnostic */}
        <g className={`${on(5)} s5`}>
          {/* an open book */}
          <g className="cs-book">
            <path d="M210 40 C196 30 176 30 160 36 V82 C176 76 196 76 210 86 Z" className="cs-body" />
            <path d="M210 40 C224 30 244 30 260 36 V82 C244 76 224 76 210 86 Z" className="cs-body" />
            <path d="M210 40 V86" className="cs-line" />
          </g>
          {/* a person's question */}
          <g className="cs-bubble cs-b1">
            <rect x="34" y="112" width="156" height="68" rx="20" className="cs-body" />
            <path d="M62 180 L52 200 L82 180" className="cs-body cs-tail" />
            <circle cx="60" cy="136" r="9" className="cs-dotw" />
            <path d="M80 130 H170 M80 144 H150 M50 160 H132" className="cs-line cs-faint" />
          </g>
          {/* a clinician's reply */}
          <g className="cs-bubble cs-b2">
            <rect x="230" y="136" width="156" height="68" rx="20" className="cs-bubble-fill" />
            <path d="M356 204 L368 224 L336 204" className="cs-bubble-fill cs-tail" />
            <circle cx="360" cy="160" r="9" className="cs-solid" />
            <path d="M360 155 V165 M355 160 H365" className="cs-plus" />
            <path d="M250 154 H336 M250 168 H320 M250 182 H300" className="cs-line cs-faint" />
          </g>
          {/* realistic next steps */}
          <path d="M62 296 L122 280 L186 296 L250 268 L318 276" className="cs-steps" />
          {STONES.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="8" className="cs-stone" style={d(i, 0.22, 0.3)} />
          ))}
          <path d="M318 276 V246 L346 256 L318 266" className="cs-flag" />
        </g>
      </svg>
    </div>
  );
}

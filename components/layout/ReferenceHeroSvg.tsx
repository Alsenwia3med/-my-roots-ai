import Image from "next/image";

const domains = [
  { code: "HU", title: "Hunger & Appetite", detail: ["Signals · Reward ·", "Eating behaviour"], x: 26, y: 38, color: "#d49a26", side: "left" },
  { code: "SL", title: "Sleep & Recovery", detail: ["Rhythms · Hormones ·", "Restoration"], x: 634, y: 38, color: "#28A0A5", side: "right" },
  { code: "ME", title: "Metabolism", detail: ["Energy · Insulin ·", "Storage"], x: 12, y: 194, color: "#28A0A5", side: "left" },
  { code: "CI", title: "Circadian Timing", detail: ["Biological Clock ·", "Hormonal Rhythm"], x: 648, y: 196, color: "#ef5c61", side: "right" },
  { code: "SA", title: "Safety & Immunity", detail: ["Inflammation · Defense ·", "Repair"], x: 28, y: 354, color: "#43b477", side: "left" },
  { code: "ST", title: "Stress Response", detail: ["HPA Axis · Resilience ·", "Adaptation"], x: 634, y: 360, color: "#f47739", side: "right" },
  { code: "IN", title: "Inflammation", detail: ["Microbiome · Gut Barrier ·", "Systemic Signals"], x: 54, y: 514, color: "#815bd6", side: "left" },
];

function domainIcon(code: string) {
  return code === "SL" ? "☾" : code === "CI" ? "◷" : code === "ST" ? "ϟ" : code === "IN" ? "≋" : code === "SA" ? "◈" : code === "ME" ? "⚙" : "♧";
}

function DomainCard({ domain }: { domain: (typeof domains)[number] }) {
  return (
    <g transform={`translate(${domain.x} ${domain.y})`}>
      <rect width="240" height="112" rx="14" fill="#f2f6fb" fillOpacity=".94" stroke={domain.color} strokeOpacity=".25" />
      <circle cx="39" cy="56" r="27" fill={domain.color} />
      <text x="39" y="65" textAnchor="middle" fill="#fff" fontSize="27" fontFamily="Georgia, serif">{domainIcon(domain.code)}</text>
      <text x="82" y="29" fill="#0F5C6A" fontSize="12" fontWeight="800" fontFamily="Arial, sans-serif">{domain.code}</text>
      <text x="82" y="52" fill="#0F5C6A" fontSize="15" fontWeight="800" fontFamily="Arial, sans-serif">{domain.title}</text>
      <text x="82" y="76" fill="#58708d" fontSize="12" fontFamily="Arial, sans-serif">{domain.detail[0]}</text>
      <text x="82" y="94" fill="#58708d" fontSize="12" fontFamily="Arial, sans-serif">{domain.detail[1]}</text>
    </g>
  );
}

export default function ReferenceHeroSvg() {
  return (
    <>
      <svg className="reference-hero-svg" viewBox="0 0 900 660" role="img" aria-labelledby="reference-svg-title reference-svg-desc" preserveAspectRatio="xMidYMid meet">
      <title id="reference-svg-title">Seven connected biological domains</title>
      <desc id="reference-svg-desc">A central human biological system connected to hunger, sleep, metabolism, circadian timing, safety, stress and inflammation.</desc>
      <defs>
        <filter id="reference-shadow"><feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#28A0A5" floodOpacity=".22" /></filter>
      </defs>
      <rect width="900" height="660" rx="14" fill="#0F5C6A" />
      <g className="reference-orbits" fill="none" stroke="#dbe7f5">
        <ellipse cx="450" cy="320" rx="314" ry="284" transform="rotate(-16 450 320)" />
        <ellipse cx="450" cy="320" rx="260" ry="220" transform="rotate(18 450 320)" strokeDasharray="3 8" />
      </g>
      <g className="reference-connections" fill="none" strokeWidth="2" opacity=".84">
        <path d="M266 94 C324 94 363 129 425 148" stroke="#d49a26" /><path d="M634 94 C576 94 537 129 475 148" stroke="#28A0A5" />
        <path d="M252 250 C317 250 359 252 420 252" stroke="#28A0A5" /><path d="M648 252 C583 252 541 252 480 252" stroke="#ef5c61" />
        <path d="M268 410 C329 410 365 390 421 390" stroke="#43b477" /><path d="M634 416 C573 416 537 395 479 395" stroke="#f47739" />
        <path d="M294 570 C351 570 394 520 450 500" stroke="#815bd6" />
      </g>
      <g className="reference-body" filter="url(#reference-shadow)">
        <image href="/assets/Glowing_Human_Hologram.png" x="267" y="10" width="366" height="640" preserveAspectRatio="xMidYMid meet" />
      </g>
      <g className="reference-nodes" fill="#fff" strokeWidth="3">
        <circle cx="425" cy="148" r="7" stroke="#d49a26" fill="#d49a26" /><circle cx="475" cy="148" r="7" stroke="#28A0A5" fill="#28A0A5" />
        <circle cx="420" cy="252" r="7" stroke="#28A0A5" fill="#28A0A5" /><circle cx="480" cy="252" r="7" stroke="#ef5c61" fill="#ef5c61" />
        <circle cx="421" cy="390" r="7" stroke="#43b477" fill="#43b477" /><circle cx="479" cy="395" r="7" stroke="#f47739" fill="#f47739" />
        <circle cx="450" cy="500" r="7" stroke="#815bd6" fill="#815bd6" />
      </g>
      {domains.map((domain) => <DomainCard domain={domain} key={domain.code} />)}
      <g transform="translate(652 566)">
        <path d="M0 0v56" stroke="#d6a126" strokeWidth="2" />
        <text x="20" y="18" fill="#e7eef5" fontSize="15" fontStyle="italic" fontFamily="Georgia, serif">The body is not a collection of parts,</text>
        <text x="20" y="40" fill="#e7eef5" fontSize="15" fontStyle="italic" fontFamily="Georgia, serif">but a network of conversations.</text>
      </g>
      </svg>
      <div className="reference-mobile-board">
        <div className="reference-mobile-figure">
          <Image
            src="/assets/Glowing_Human_Hologram.png"
            alt="Glowing blue hologram of the human body, with the heart and spine highlighted"
            width={768}
            height={1344}
            unoptimized
            loading="lazy"
          />
        </div>
        <div className="reference-mobile-domains">
          {domains.map((domain) => (
            <article className="reference-mobile-domain" key={domain.code}>
              <span className="domain-icon" style={{ backgroundColor: domain.color }}>{domainIcon(domain.code)}</span>
              <div>
                <b>{domain.code}</b>
                <h2>{domain.title}</h2>
                <p>{domain.detail.join(" ")}</p>
              </div>
            </article>
          ))}
        </div>
        <blockquote className="reference-mobile-quote">The body is not a collection of parts, but a network of conversations.</blockquote>
      </div>
    </>
  );
}

/**
 * Copy used by the site chrome (header, ticker, footers), lifted verbatim from the components
 * that rendered it before the Lux redesign:
 *   - NAV / MORE / MOBILE / CTA ........ components/SiteHeader.tsx and components/layout/Header.tsx
 *   - NEWS ............................. components/RootsV1.tsx (homepage ticker)
 *   - INNER_FOOTER ..................... components/layout/Footer.tsx
 *   - HOME_FOOTER ...................... components/RootsV1.tsx (homepage footer)
 * Nothing here is new wording; the redesign only changes how it is presented.
 */

export type NavLink = readonly [label: string, href: string];

export const NAV: readonly NavLink[] = [
  ["How It Works", "/how-it-works"],
  ["Platform", "/platform"],
  ["Example Report", "/example-report"],
  ["Research", "/research"],
  ["About", "/about"],
];

export const MORE: readonly NavLink[] = [
  ["Healthcare Professionals", "/healthcare-professionals"],
  ["Pilot Program", "/pilot"],
  ["Contact", "/contact"],
  ["Blog", "/blog"],
];

export const MOBILE: readonly NavLink[] = [
  ["Home", "/"],
  ...NAV,
  ...MORE,
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Cookies", "/cookies"],
  ["Medical Disclaimer", "/medical-disclaimer"],
  ["AI Disclaimer", "/ai-disclaimer"],
];

export const CTA: NavLink = ["Start Your Assessment", "/assessment"];

export const NEWS = [
  "ROOTS-AI™ Free Beta now open — check eligibility",
  "Phase 1 available: assessment and governed report engine",
  "Sample 19-section report ready to view",
  "Seven biological domains · 73 questions · one connected view",
  "Educational, not diagnostic",
] as const;

export interface FooterColumn {
  title: string;
  links: readonly NavLink[];
}

export interface FooterData {
  columns: readonly FooterColumn[];
  /** Bottom-row statements, in their original order. */
  notes: readonly string[];
  copyright: string;
}

export const INNER_FOOTER: FooterData = {
  columns: [
    {
      title: "Product",
      links: [
        ["Assessment", "/assessment"],
        ["Example Report", "/example-report"],
        ["How It Works", "/how-it-works"],
        ["Platform", "/platform"],
      ],
    },
    {
      title: "Company",
      links: [
        ["About", "/about"],
        ["Research", "/research"],
        ["Healthcare Professionals", "/healthcare-professionals"],
        ["Pilot Program", "/pilot"],
        ["Contact", "/contact"],
        ["Blog", "/blog"],
      ],
    },
    {
      title: "Legal",
      links: [
        ["Privacy", "/privacy"],
        ["Terms", "/terms"],
        ["Cookies", "/cookies"],
        ["Medical Disclaimer", "/medical-disclaimer"],
        ["AI Disclaimer", "/ai-disclaimer"],
      ],
    },
  ],
  notes: [
    "ROOTS-AI™ provides educational wellness information and does not diagnose or treat medical conditions.",
    "We use essential technologies to keep ROOTS-AI™ secure. With your permission, we may use limited analytics on public pages. We do not use advertising pixels or session replay on assessment, report, sign-in or admin pages.",
  ],
  copyright: "© 2026 ROOTS AI HEALTH SYSTEMS, Inc. All rights reserved.",
};

export const HOME_FOOTER: FooterData = {
  columns: [
    {
      title: "Product",
      links: [
        ["Biological Assessment", "/assessment"],
        ["Sample 19-Section Report", "/example-report"],
        ["How It Works", "/how-it-works"],
      ],
    },
    {
      title: "Architecture",
      links: [
        ["7 Biological Domains", "/platform"],
        ["Deterministic Logic Rules", "/platform"],
        ["Clinical Uncertainty Engine", "/platform"],
      ],
    },
    {
      title: "Governance",
      links: [
        ["Beta Pilot Program", "/pilot"],
        ["HIPAA / GDPR Protection", "/privacy"],
        ["Zero Hallucination Bounds", "/ai-disclaimer"],
      ],
    },
    {
      title: "Legal",
      links: [
        ["Non-Diagnostic Educational Tool", "/medical-disclaimer"],
        ["Privacy Policy", "/privacy"],
        ["Terms of Service", "/terms"],
      ],
    },
  ],
  notes: [
    "ROOTS-AI™ is an educational and biological intelligence software platform developed to evaluate self-reported physiological patterns. It does not provide medical diagnoses, clinical treatment plans, or emergency health assessments. Always consult a qualified physician or endocrinologist before making clinical decisions.",
  ],
  copyright: "© 2026 ROOTS-AI Health Inc. All rights reserved.",
};

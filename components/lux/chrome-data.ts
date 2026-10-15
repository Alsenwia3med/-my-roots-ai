/**
 * Copy used by the site chrome (header, ticker, footers), lifted verbatim from the components
 * that rendered it before the Lux redesign:
 *   - NAV / MORE / MOBILE / CTA ........ components/SiteHeader.tsx and components/layout/Header.tsx
 *   - NEWS ............................. components/RootsV1.tsx (homepage ticker)
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
  ["Pilot", "/pilot"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

export const MOBILE: readonly NavLink[] = [
  ["Home", "/"],
  ["How It Works", "/how-it-works"],
  ["Platform", "/platform"],
  ["Research", "/research"],
  ["Healthcare Professionals", "/healthcare-professionals"],
  ["Example Report", "/example-report"],
  ["About", "/about"],
  ["Pilot Program", "/pilot"],
  ["Contact", "/contact"],
  ["Blog", "/blog"],
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
        ["Privacy & Data Protection", "/privacy"],
        ["Defined AI Safety Boundaries", "/ai-disclaimer"],
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
  copyright: "© ROOTS AI HEALTH SYSTEMS, Inc. All rights reserved.",
};

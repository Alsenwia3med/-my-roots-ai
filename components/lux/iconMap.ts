import {
  Activity,
  BadgeCheck,
  Ban,
  BookOpen,
  Bot,
  Building2,
  Calculator,
  ChartNoAxesColumn,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  Dna,
  EyeOff,
  FileLock2,
  FileSignature,
  Fingerprint,
  FlaskConical,
  Gauge,
  Handshake,
  LockKeyhole,
  Microscope,
  Network,
  Route,
  Scale,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  TestTubeDiagonal,
  Timer,
  UserCheck,
  Watch,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * Which glyph sits beside which governed sentence. Matched on the start of the sentence so the
 * copy itself stays the single source of truth; anything unmatched falls back by keyword.
 */
const EXACT: Array<[prefix: string, icon: LucideIcon]> = [
  /* how it works — the six-step sequence */
  ["1. Complete the 73-question assessment", ClipboardList],
  ["2. Validation normalizes", ClipboardCheck],
  ["3. Deterministic rules calculate", Calculator],
  ["4. C-02 v1.0.1 deterministic rules select", Route],
  ["5. Governed AI may express", Bot],
  ["6. The web and PDF reports", FileLock2],
  ["An AI language model may assist", Sparkles],
  ["The model is not permitted", Ban],
  ["Private by design", LockKeyhole],
  /* platform */
  ["Available: Assessment and governed report engine", ClipboardCheck],
  ["Coming Soon: Laboratory data integration", FlaskConical],
  ["Coming Soon: DNA and epigenetic insights", Dna],
  ["Coming Soon: Microbiome analysis", Microscope],
  ["Coming Soon: Wearable integrations", Watch],
  ["Coming Soon: ROOTS Biological Twin", Fingerprint],
  ["Seven biological domains", Network],
  /* research */
  ["Service consent and research consent", FileSignature],
  ["Pseudonymized data", EyeOff],
  ["Pilot findings will be reported", ChartNoAxesColumn],
  ["Research export excludes", ShieldCheck],
  /* healthcare professionals */
  ["See the exact answers", ScanSearch],
  ["Review data completeness", Gauge],
  ["Questionnaire scores are proprietary", Scale],
  ["Distinguish deterministic calculation", Cpu],
  ["Use suggested laboratory discussions", TestTubeDiagonal],
  /* pilot */
  ["Eligibility:", UserCheck],
  ["Answer 73 questions", Timer],
  ["No payment is required", BadgeCheck],
  ["The report is educational", BookOpen],
  ["Participation is voluntary", Handshake],
  ["Beta feedback may be used", FileSignature],
  /* about */
  ["Mission:", Target],
  ["Method:", Workflow],
  ["Company:", Building2],
  ["Educational, not diagnostic", ShieldCheck],
];

const KEYWORDS: Array<[RegExp, LucideIcon]> = [
  [/consent/i, FileSignature],
  [/privacy|private|identif/i, LockKeyhole],
  [/score|calculat|deterministic/i, Calculator],
  [/AI\b|model/i, Bot],
  [/report/i, ClipboardCheck],
  [/laborator/i, TestTubeDiagonal],
  [/research|pilot/i, Microscope],
  [/domain|connected/i, Network],
];

export function iconFor(sentence: string, fallback: LucideIcon = Activity): LucideIcon {
  const exact = EXACT.find(([prefix]) => sentence.startsWith(prefix));
  if (exact) return exact[1];
  const kw = KEYWORDS.find(([re]) => re.test(sentence));
  return kw ? kw[1] : fallback;
}

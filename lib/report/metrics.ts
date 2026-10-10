/**
 * The four headline figures on the report cover, built once for both renderings.
 *
 * C-03 requires the web report and the PDF to render from the same stored canonical JSON, and
 * neither may reinterpret a deterministic result. Sharing this function is how that holds for
 * the cover cards: there is one place where a value becomes text, so the two outputs cannot
 * drift apart.
 *
 * A score that could not be calculated shows the approved "Not enough information" copy and no
 * denominator. Rendering "— /100" implies a scale the value does not sit on, which the final
 * report review (point 2) asks to be removed and C-03 RPT-02 forbids filling in.
 */

import { COPY } from './c03-content';

export interface HeadlineMetric {
  label: string;
  value: string;
  /** The denominator or qualifier shown under the value; empty when no scale applies. */
  note: string;
  /** True when the value is the approved null copy rather than a number. */
  unavailable: boolean;
}

export interface HeadlineSource {
  biological_state: number | null;
  opportunity_score: number | null;
  recovery_potential: number | null;
  confidence: { score: number; label: string };
}

function scored(label: string, value: number | null, decimals: number): HeadlineMetric {
  return value === null
    ? { label, value: COPY.domainNull, note: '', unavailable: true }
    : { label, value: value.toFixed(decimals), note: '/100', unavailable: false };
}

export function headlineMetrics(report: HeadlineSource): HeadlineMetric[] {
  return [
    scored('Biological State', report.biological_state, 0),
    // C-02: Opportunity and Recovery Potential retain one decimal.
    scored('Opportunity', report.opportunity_score, 1),
    scored('Recovery Potential', report.recovery_potential, 1),
    { label: 'Confidence', value: report.confidence.label, note: `${report.confidence.score}/100`, unavailable: false },
  ];
}

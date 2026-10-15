/**
 * PUB-04 Example Report (C-05).
 *
 * Zones, in the order C-05 lists them:
 *   1 Intro            example-only badge and disclaimer
 *   2 Report viewer    all 19 sections using approved sample data
 *   3 Sticky contents  section links
 *   4 CTA              Start Your Assessment
 *   5 Footer disclaimer  full educational boundary
 *
 * Content comes from lib/content/example-report.ts, which transcribes C-03 §8's reference
 * sample. The page renders the governed 19-section architecture with the seven canonical
 * domains; it introduces no finding, recommendation or category of its own. The layout lives in
 * components/rp/ExampleReport.tsx.
 */

import type { Metadata } from 'next';
import { EXAMPLE_REPORT } from '@/lib/content/c04-pages';
import ExampleReport from '@/components/rp/ExampleReport';

export const metadata: Metadata = {
  title: EXAMPLE_REPORT.meta!.title,
  description: EXAMPLE_REPORT.meta!.description,
};

export default function ExampleReportPage() {
  return <ExampleReport kicker="ROOTS / EXAMPLE REPORT" />;
}

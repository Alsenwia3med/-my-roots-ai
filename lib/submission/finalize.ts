/**
 * After a submission is committed: score it (C-02), then generate its report (C-03).
 *
 * Used by the submit route, ASM-11 "Retry Report Preparation" and ADM-05 report recovery. Never throws and never
 * touches the submission itself — the submitted snapshot stays authoritative whatever happens
 * here. Each step is audited; each is safe to repeat, so a retry simply finishes whatever did
 * not complete last time.
 */

import 'server-only';
import type { RawAnswer } from '@/lib/assessment/validation';
import { audit } from '@/lib/audit';
import { generateReport } from '@/lib/report/persist';
import { REPORT_TEMPLATE_VERSION } from '@/lib/report/c03-content';
import { SCORING_VERSION } from '@/lib/scoring/c02-ruleset';
import { scoreAssessment } from '@/lib/scoring/persist';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface FinalizeResult {
  scored: boolean;
  report: 'completed' | 'failed';
}

export async function finalizeSubmission(
  assessment: { id: string; profile_id: string; questionnaire_version: string },
  answers: Readonly<Record<string, RawAnswer>>,
  actorId: string,
  actorType: 'participant' | 'admin' = 'participant',
): Promise<FinalizeResult> {
  const admin = getSupabaseAdmin();
  const base = { actorId, actorType, objectType: 'assessment', objectId: assessment.id } as const;

  try {
    const outcome = await scoreAssessment(admin, assessment.id, answers);
    if (outcome === 'scored') {
      await audit({ action: 'assessment.scored', result: 'success', ...base, details: { scoring_version: SCORING_VERSION } });
    }
  } catch (error) {
    console.error('assessment scoring failed:', error instanceof Error ? error.message : error);
    await audit({ action: 'assessment.scored', result: 'failure', ...base, details: { scoring_version: SCORING_VERSION, reason: 'scoring_failed' } });
    // Without scores there can be no report.
    await audit({ action: 'report.generated', result: 'failure', ...base, details: { reason: 'SCORES_MISSING' } });
    return { scored: false, report: 'failed' };
  }

  try {
    const outcome = await generateReport(admin, assessment, answers);
    if (outcome === 'generated') {
      await audit({ action: 'report.generated', result: 'success', ...base, details: { report_template_version: REPORT_TEMPLATE_VERSION } });
    }
    return { scored: true, report: 'completed' };
  } catch (error) {
    const reason = error instanceof Error ? error.message.split(':')[0] : 'UNKNOWN';
    console.error('report generation failed:', reason);
    await audit({ action: 'report.generated', result: 'failure', ...base, details: { reason } });
    return { scored: true, report: 'failed' };
  }
}

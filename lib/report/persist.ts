/**
 * Generates and stores the canonical report for a submitted, scored assessment (C-03).
 *
 * Written with the service role (participants read their own report through RLS, never write
 * it). Safe to repeat: a completed report is never regenerated, and a failed one is retried
 * in place. Before a report is published, the scores it contains are compared with the
 * stored score row — if they ever differed, no report is published (C-03 RPT-01: scores must
 * match exactly).
 */

import 'server-only';
import { randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RawAnswer } from '@/lib/assessment/validation';
import { DOMAIN_ORDER } from '@/lib/scoring/c02-ruleset';
import { computeScores } from '@/lib/scoring/engine';
import { normalizeAnswers } from '@/lib/scoring/fromAnswers';
import { applyNarrative } from '@/lib/ai/apply';
import { generateNarrative } from '@/lib/ai/narrative';
import { buildProjection } from '@/lib/ai/projection';
import { buildReport, classify, driverName } from './build';
import { DISCLAIMER_VERSION, REPORT_TEMPLATE_VERSION } from './c03-content';
import { reportChecksum } from './canonical';

export type ReportOutcome = 'generated' | 'already_generated';

const DOMAIN_COLUMNS: Record<string, string> = { MR: 'mr_score', SR: 'sr_score', HS: 'hs_score', SL: 'sl_score', IB: 'ib_score', CH: 'ch_score', BS: 'bs_score' };

function newReportReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from(randomBytes(8), (b) => alphabet[b % alphabet.length]).join('');
  return `RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${code}`;
}

export async function generateReport(
  admin: SupabaseClient,
  assessment: { id: string; profile_id: string; questionnaire_version: string },
  answers: Readonly<Record<string, RawAnswer>>,
): Promise<ReportOutcome> {
  const { data: existing } = await admin.from('reports').select('id, status').eq('assessment_id', assessment.id).maybeSingle();
  if (existing?.status === 'completed') return 'already_generated';

  try {
    const { data: stored, error: scoresError } = await admin.from('scores').select('*').eq('assessment_id', assessment.id).maybeSingle();
    if (scoresError || !stored) throw new Error('SCORES_MISSING');

    const { input } = normalizeAnswers(answers);
    const scoring = computeScores(input);

    // Integrity: the report must show exactly the stored scores.
    const toNumber = (v: unknown) => (v === null || v === undefined ? null : Number(v));
    const mismatch =
      DOMAIN_ORDER.some((d) => toNumber(stored[DOMAIN_COLUMNS[d]]) !== scoring.domains[d]) ||
      toNumber(stored.biological_state) !== scoring.biological_state ||
      toNumber(stored.opportunity_score) !== scoring.opportunity ||
      toNumber(stored.recovery_potential) !== scoring.recovery_potential ||
      toNumber(stored.confidence) !== scoring.confidence ||
      stored.scoring_version !== scoring.scoring_version;
    if (mismatch) throw new Error('SCORES_MISMATCH');

    const { data: profile } = await admin.from('profiles').select('display_name').eq('id', assessment.profile_id).maybeSingle();
    const reference = newReportReference();
    const deterministic = buildReport({
      reportId: reference,
      generatedAt: new Date().toISOString(),
      participantDisplay: (profile?.display_name as string | null) ?? null,
      questionnaireVersion: assessment.questionnaire_version,
      auditTraceReference: `scores/${stored.id as string}`,
      scoring,
      protective: { P1: input.P1, P2: input.P2, P3: input.P3, P4: input.P4, P5: input.P5 },
      answers,
    });

    // The AI boundary: the deterministic report is finished and verified above before the
    // narrative layer is asked anything, and it is shown only the read-only projection
    // (Annex AI-01). A narrative failure never fails the report — generateNarrative returns
    // the approved fallback instead, and applyNarrative records which happened (AI-06/AI-07).
    const freeText = answers.Q73;
    const narrative = await generateNarrative(
      buildProjection({
        scoring,
        driverLabels: Object.fromEntries(scoring.drivers.map((d) => [d, driverName(d)])),
        biologicalStateClassification: scoring.biological_state === null ? null : classify(scoring.biological_state),
        protectiveFactors: deterministic.protective_factors,
        freeTextPresent: typeof freeText === 'string' && freeText.trim() !== '',
        questionnaireVersion: assessment.questionnaire_version,
        reportTemplateVersion: deterministic.report_template_version,
      }),
    );
    const report = applyNarrative(deterministic, narrative);

    const row = {
      assessment_id: assessment.id,
      report_version: REPORT_TEMPLATE_VERSION,
      status: 'completed',
      report_reference: reference,
      canonical_json: report,
      canonical_json_checksum: reportChecksum(report),
      generated_at: report.generated_at,
      generation_metadata: {
        narrative_template_version: report.narrative_template_version,
        disclaimer_version: DISCLAIMER_VERSION,
        narrative_source: report.narrative_provenance.outcome,
        // AI-06: the exact configuration behind this snapshot.
        narrative_provenance: report.narrative_provenance,
      },
    };
    const { error } = existing
      ? await admin.from('reports').update(row).eq('id', existing.id)
      : await admin.from('reports').insert(row);
    if (error) throw new Error(`REPORT_WRITE_FAILED: ${error.message}`);
    return 'generated';
  } catch (e) {
    const code = e instanceof Error ? e.message.split(':')[0] : 'UNKNOWN';
    const failed = { assessment_id: assessment.id, report_version: REPORT_TEMPLATE_VERSION, status: 'failed', generation_metadata: { failure_code: code } };
    if (existing) await admin.from('reports').update(failed).eq('id', existing.id);
    else await admin.from('reports').insert(failed);
    throw e;
  }
}

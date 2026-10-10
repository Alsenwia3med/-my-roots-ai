/**
 * ADM-09 research export — cohort selection, pseudonymisation and encrypted storage.
 *
 * Cohort: submitted assessments with a stored score, whose participant's latest research
 * consent is granted and not withdrawn (the approved consent criterion; it cannot be relaxed),
 * optionally narrowed by questionnaire version and submission date. Staff accounts are never
 * included.
 *
 * Research ID: HMAC of the account ID with a key specific to this export, so the same person
 * has a different ID in every export — exports cannot be joined with each other or with the
 * admin pseudonyms (P-XXXXXXXX).
 *
 * Storage: the CSV is encrypted with AES-256-GCM before it is written, can be downloaded only
 * until it expires, and is destroyed at expiry. Everything runs with the service role, after
 * the Research Admin check in the route.
 */

import 'server-only';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { appEnv } from '@/lib/env';
import { riskCheck, toCsv, type ExportField } from './fields';

export interface ExportCriteria {
  questionnaireVersion?: string;
  from?: string; // YYYY-MM-DD, submitted on or after
  to?: string; // YYYY-MM-DD, submitted on or before
}

export const CONSENT_CRITERION = 'Research consent granted and not withdrawn';

function encryptionKey(): Buffer {
  const configured = process.env.RESEARCH_EXPORT_KEY;
  if (configured && /^[0-9a-f]{64}$/i.test(configured)) return Buffer.from(configured, 'hex');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) return createHmac('sha256', serviceRoleKey).update('roots-ai/research-export/v1').digest();
  if (appEnv() === 'development') return createHash('sha256').update('development-only-export-key').digest();
  throw new Error('RESEARCH_EXPORT_KEY is not configured.');
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
}

export function decrypt(payload: string): string {
  const [iv, tag, data] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

interface CohortRow {
  profile_id: string;
  record: Record<string, unknown>;
}

const SCORE_COLUMNS =
  'assessment_id, mr_score, sr_score, hs_score, sl_score, ib_score, ch_score, bs_score, biological_state, opportunity_score, recovery_potential, confidence, confidence_label, protective_count, primary_driver, secondary_driver, tertiary_driver, scoring_version';

/** The consented, submitted, scored cohort. Pilot scale: assembled on the server. */
export async function selectCohort(admin: SupabaseClient, criteria: ExportCriteria): Promise<CohortRow[]> {
  let q = admin.from('assessments').select('id, profile_id, questionnaire_version, submitted_at').eq('status', 'submitted');
  if (criteria.questionnaireVersion) q = q.eq('questionnaire_version', criteria.questionnaireVersion);
  if (criteria.from) q = q.gte('submitted_at', `${criteria.from}T00:00:00Z`);
  if (criteria.to) q = q.lte('submitted_at', `${criteria.to}T23:59:59Z`);
  const { data: assessments, error } = await q;
  if (error) throw new Error(`cohort lookup failed: ${error.message}`);
  if (!assessments?.length) return [];

  const profileIds = [...new Set(assessments.map((a) => a.profile_id as string))];
  const [consents, staff, scores] = await Promise.all([
    admin.from('consents').select('profile_id, granted, withdrawn_at, created_at').eq('consent_type', 'research').in('profile_id', profileIds),
    admin.from('role_assignments').select('profile_id').is('revoked_at', null),
    admin.from('scores').select(SCORE_COLUMNS).in('assessment_id', assessments.map((a) => a.id as string)),
  ]);
  if (consents.error || staff.error || scores.error) throw new Error('cohort lookup failed');

  // Latest research decision per participant.
  const latest = new Map<string, { granted: boolean; withdrawn: boolean; at: string }>();
  for (const c of consents.data ?? []) {
    const prev = latest.get(c.profile_id as string);
    if (!prev || (c.created_at as string) > prev.at) {
      latest.set(c.profile_id as string, { granted: c.granted as boolean, withdrawn: c.withdrawn_at !== null, at: c.created_at as string });
    }
  }
  const staffIds = new Set((staff.data ?? []).map((s) => s.profile_id as string));
  const scoreByAssessment = new Map((scores.data ?? []).map((s) => [s.assessment_id as string, s as Record<string, unknown>]));

  return assessments.flatMap((a) => {
    const consent = latest.get(a.profile_id as string);
    const score = scoreByAssessment.get(a.id as string);
    if (!consent?.granted || consent.withdrawn || staffIds.has(a.profile_id as string) || !score) return [];
    const { assessment_id: _omit, ...scoreFields } = score;
    return [{
      profile_id: a.profile_id as string,
      record: {
        ...scoreFields,
        questionnaire_version: a.questionnaire_version,
        submitted_month: (a.submitted_at as string | null)?.slice(0, 7) ?? null,
      },
    }];
  });
}

export async function buildExport(admin: SupabaseClient, criteria: ExportCriteria, fields: ExportField[]) {
  const cohort = await selectCohort(admin, criteria);
  const risk = riskCheck(cohort.length, fields);
  const salt = randomBytes(32);
  const rows = cohort
    .map((c) => ({ ...c.record, research_id: `R-${createHmac('sha256', salt).update(c.profile_id).digest('hex').slice(0, 16).toUpperCase()}` }))
    // Row order must not reveal submission order.
    .sort((x, y) => String(x.research_id).localeCompare(String(y.research_id)));
  const csv = toCsv(fields, rows);
  return { risk, rowCount: rows.length, csv, checksum: createHash('sha256').update(csv).digest('hex') };
}

/** Destroys expired export files. Called whenever the export screen or a download is used. */
export async function purgeExpired(admin: SupabaseClient): Promise<void> {
  await admin.from('research_exports').update({ payload: null }).lt('expires_at', new Date().toISOString()).not('payload', 'is', null);
}

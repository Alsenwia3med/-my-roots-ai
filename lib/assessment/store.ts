/**
 * Participant data access. Every query here uses the participant's own session client, so
 * Row Level Security decides what is visible; nothing in this file uses the service role.
 */

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LEGAL_VERSION } from './copy';
import type { RawAnswer } from './validation';

export interface AssessmentRow {
  id: string;
  profile_id: string;
  questionnaire_version: string;
  status: 'in_progress' | 'submitted' | 'archived';
  current_module: number;
  progress_percent: number;
  started_at: string;
  last_saved_at: string | null;
  submitted_at: string | null;
  submission_reference: string | null;
  submit_idempotency_key: string | null;
}

const ASSESSMENT_COLUMNS =
  'id, profile_id, questionnaire_version, status, current_module, progress_percent, started_at, last_saved_at, submitted_at, submission_reference, submit_idempotency_key';

/** True when the participant's latest service consent for the current legal version is granted. */
export async function hasServiceConsent(supabase: SupabaseClient, profileId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('consents')
    .select('granted')
    .eq('profile_id', profileId)
    .eq('consent_type', 'service')
    .eq('document_version', LEGAL_VERSION.version)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`consent lookup failed: ${error.message}`);
  return data?.granted === true;
}

export async function getInProgressAssessment(supabase: SupabaseClient): Promise<AssessmentRow | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select(ASSESSMENT_COLUMNS)
    .eq('status', 'in_progress')
    .maybeSingle();
  if (error) throw new Error(`assessment lookup failed: ${error.message}`);
  return data as AssessmentRow | null;
}

export async function getLatestSubmittedAssessment(supabase: SupabaseClient): Promise<AssessmentRow | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select(ASSESSMENT_COLUMNS)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`assessment lookup failed: ${error.message}`);
  return data as AssessmentRow | null;
}

/** An assessment the participant owns, or null (someone else's reads as not found). */
export async function getOwnedAssessment(supabase: SupabaseClient, id: string): Promise<AssessmentRow | null> {
  const { data, error } = await supabase.from('assessments').select(ASSESSMENT_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw new Error(`assessment lookup failed: ${error.message}`);
  return data as AssessmentRow | null;
}

/** Saved answers keyed by question ID, as the participant entered them. */
export async function loadAnswers(supabase: SupabaseClient, assessmentId: string): Promise<Record<string, RawAnswer>> {
  const { data, error } = await supabase.from('responses').select('question_id, raw_value').eq('assessment_id', assessmentId);
  if (error) throw new Error(`answer lookup failed: ${error.message}`);
  return Object.fromEntries((data ?? []).map((r) => [r.question_id as string, r.raw_value as RawAnswer]));
}

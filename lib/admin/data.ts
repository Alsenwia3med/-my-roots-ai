/**
 * Read models for the admin screens. Queries run with the staff member's own session, so the
 * database's staff SELECT policies (is_staff()) decide what is visible. The one exception is the
 * ADM-05 failure code, read with the service role (see listReports). Health answers are never read: responses has no staff policy.
 *
 * Pilot-scale note: participant lists are assembled on the server from the whole (small)
 * participant population and paginated there, so only one page ever reaches the browser. At
 * PostgREST's default 1,000-row limit this should move to a database view with SQL paging.
 */

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { formatDateTime, maskEmail, pseudonym } from './format';

export const PAGE_SIZE = 20;

export type ParticipantStatus = 'not_started' | 'in_progress' | 'submitted' | 'archived';
export type ReportState = 'none' | 'generating' | 'completed' | 'failed';

export const STATUS_LABELS: Record<ParticipantStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
  archived: 'Archived',
};

export const REPORT_LABELS: Record<ReportState, string> = {
  none: 'No report',
  generating: 'Generating',
  completed: 'Ready',
  failed: 'Failed',
};

interface AssessmentRow {
  id: string;
  profile_id: string;
  status: 'in_progress' | 'submitted' | 'archived';
  progress_percent: number;
  questionnaire_version: string;
  started_at: string;
  last_saved_at: string | null;
  submitted_at: string | null;
  archived_at: string | null;
}

interface ReportRow {
  assessment_id: string;
  status: 'generating' | 'completed' | 'failed';
  report_version: string;
  created_at: string;
}

export interface ParticipantSummary {
  id: string;
  pseudonym: string;
  maskedEmail: string;
  status: ParticipantStatus;
  reportState: ReportState;
  createdAt: string;
  lastActivity: string | null;
}

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`${what} failed: ${error?.message ?? 'unknown error'}`);
}

/** The assessment that represents a participant now: in progress, else latest submitted, else latest archived. */
function currentAssessment(list: AssessmentRow[]): AssessmentRow | null {
  const byRecent = [...list].sort((a, b) => b.started_at.localeCompare(a.started_at));
  return (
    byRecent.find((a) => a.status === 'in_progress') ??
    byRecent.find((a) => a.status === 'submitted') ??
    byRecent.find((a) => a.status === 'archived') ??
    null
  );
}

async function staffProfileIds(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase.from('role_assignments').select('profile_id').is('revoked_at', null);
  if (error) fail('staff lookup', error);
  return new Set((data ?? []).map((r) => r.profile_id as string));
}

export interface ParticipantFilters {
  status?: ParticipantStatus;
  report?: ReportState;
  from?: string;
  to?: string;
  page: number;
}

export async function listParticipants(supabase: SupabaseClient, filters: ParticipantFilters) {
  const [profiles, assessments, reports, staff] = await Promise.all([
    supabase.from('profiles').select('id, email, created_at').order('created_at', { ascending: false }),
    supabase
      .from('assessments')
      .select('id, profile_id, status, progress_percent, questionnaire_version, started_at, last_saved_at, submitted_at, archived_at'),
    supabase.from('reports').select('assessment_id, status, report_version, created_at'),
    staffProfileIds(supabase),
  ]);
  if (profiles.error) fail('participant lookup', profiles.error);
  if (assessments.error) fail('assessment lookup', assessments.error);
  if (reports.error) fail('report lookup', reports.error);

  const byProfile = new Map<string, AssessmentRow[]>();
  for (const a of (assessments.data ?? []) as AssessmentRow[]) {
    byProfile.set(a.profile_id, [...(byProfile.get(a.profile_id) ?? []), a]);
  }
  const reportByAssessment = new Map(((reports.data ?? []) as ReportRow[]).map((r) => [r.assessment_id, r]));

  let rows: ParticipantSummary[] = (profiles.data ?? [])
    .filter((p) => !staff.has(p.id as string))
    .map((p) => {
      const current = currentAssessment(byProfile.get(p.id as string) ?? []);
      const report = current ? reportByAssessment.get(current.id) : undefined;
      return {
        id: p.id as string,
        pseudonym: pseudonym(p.id as string),
        maskedEmail: maskEmail(p.email as string | null),
        status: (current?.status ?? 'not_started') as ParticipantStatus,
        reportState: (report?.status ?? 'none') as ReportState,
        createdAt: p.created_at as string,
        lastActivity: current ? current.submitted_at ?? current.last_saved_at ?? current.started_at : null,
      };
    });

  if (filters.status) rows = rows.filter((r) => r.status === filters.status);
  if (filters.report) rows = rows.filter((r) => r.reportState === filters.report);
  if (filters.from) rows = rows.filter((r) => r.createdAt.slice(0, 10) >= filters.from!);
  if (filters.to) rows = rows.filter((r) => r.createdAt.slice(0, 10) <= filters.to!);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page), totalPages);
  return { rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, page, totalPages };
}

export interface AuditRow {
  id: string;
  action: string;
  result: string;
  actor_type: string;
  actor_id: string | null;
  object_type: string | null;
  object_id: string | null;
  details: Record<string, unknown>;
  occurred_at: string;
}

export async function getParticipantDetail(supabase: SupabaseClient, id: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, status, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) fail('participant lookup', error);
  if (!profile) return null;

  const [assessments, consents] = await Promise.all([
    supabase
      .from('assessments')
      .select('id, profile_id, status, progress_percent, questionnaire_version, started_at, last_saved_at, submitted_at, archived_at')
      .eq('profile_id', id)
      .order('started_at', { ascending: false }),
    supabase
      .from('consents')
      .select('consent_type, granted, document_version, created_at')
      .eq('profile_id', id)
      .order('created_at', { ascending: false }),
  ]);
  if (assessments.error) fail('assessment lookup', assessments.error);
  if (consents.error) fail('consent lookup', consents.error);

  const list = (assessments.data ?? []) as AssessmentRow[];
  const current = currentAssessment(list);
  const ids = list.map((a) => a.id);

  const [reports, auditByActor, auditByObject] = await Promise.all([
    ids.length ? supabase.from('reports').select('assessment_id, status, report_version, created_at').in('assessment_id', ids) : { data: [], error: null },
    supabase.from('audit_logs').select('id, action, result, actor_type, actor_id, object_type, object_id, details, occurred_at').eq('actor_id', id).order('occurred_at', { ascending: false }).limit(25),
    ids.length
      ? supabase.from('audit_logs').select('id, action, result, actor_type, actor_id, object_type, object_id, details, occurred_at').in('object_id', ids).order('occurred_at', { ascending: false }).limit(25)
      : { data: [], error: null },
  ]);
  if (reports.error) fail('report lookup', reports.error);

  const seen = new Set<string>();
  const logged = [...((auditByActor.data ?? []) as AuditRow[]), ...((auditByObject.data ?? []) as AuditRow[])]
    .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, 25);

  const report = current ? ((reports.data ?? []) as ReportRow[]).find((r) => r.assessment_id === current.id) ?? null : null;
  const serviceConsent = (consents.data ?? []).find((c) => c.consent_type === 'service');

  return {
    id: profile.id as string,
    pseudonym: pseudonym(profile.id as string),
    maskedEmail: maskEmail(profile.email as string | null),
    accountStatus: profile.status as string,
    createdAt: profile.created_at as string,
    current,
    assessmentCount: list.length,
    report,
    consents: consents.data ?? [],
    timeline: [
      { label: 'Account created', at: profile.created_at as string },
      { label: 'Consent recorded', at: (serviceConsent?.created_at as string | undefined) ?? null },
      { label: 'Assessment started', at: current?.started_at ?? null },
      { label: 'Last saved', at: current?.last_saved_at ?? null },
      { label: 'Submitted', at: current?.submitted_at ?? null },
      { label: 'Report', at: report?.created_at ?? null },
    ],
    logged,
  };
}

async function countWhere(supabase: SupabaseClient, table: string, column: string, value: string): Promise<number | null> {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq(column, value);
  return error ? null : count ?? 0;
}

export async function overviewMetrics(supabase: SupabaseClient) {
  const [inProgress, submitted, reportsReady, reportsFailed, failures] = await Promise.all([
    countWhere(supabase, 'assessments', 'status', 'in_progress'),
    countWhere(supabase, 'assessments', 'status', 'submitted'),
    countWhere(supabase, 'reports', 'status', 'completed'),
    countWhere(supabase, 'reports', 'status', 'failed'),
    supabase.from('reports').select('id, assessment_id, report_version, created_at').eq('status', 'failed').order('created_at', { ascending: false }).limit(5),
  ]);
  const healthy = [inProgress, submitted, reportsReady, reportsFailed].every((v) => v !== null) && !failures.error;
  return { inProgress, submitted, reportsReady, reportsFailed, failures: failures.data ?? [], healthy };
}

export interface AuditFilters {
  actor?: string;
  action?: string;
  object?: string;
  /** Exact object ID (e.g. an assessment ID), for "audit events" links from other screens. */
  ref?: string;
  result?: string;
  from?: string;
  to?: string;
  page: number;
}

export async function listAudit(supabase: SupabaseClient, filters: AuditFilters) {
  let query = supabase
    .from('audit_logs')
    .select('id, action, result, actor_type, actor_id, object_type, object_id, details, occurred_at', { count: 'exact' })
    .order('occurred_at', { ascending: false });
  // Actor is either an actor type or a full account ID; anything else is ignored rather than
  // passed to a UUID column, where Postgres would reject it.
  if (filters.actor && ['anonymous', 'participant', 'admin', 'system'].includes(filters.actor)) query = query.eq('actor_type', filters.actor);
  else if (filters.actor && /^[0-9a-f-]{36}$/i.test(filters.actor)) query = query.eq('actor_id', filters.actor);
  if (filters.action) query = query.ilike('action', `%${filters.action.replace(/[%_]/g, '')}%`);
  if (filters.object) query = query.eq('object_type', filters.object);
  if (filters.ref) query = query.eq('object_id', filters.ref);
  if (filters.result) query = query.eq('result', filters.result);
  if (filters.from) query = query.gte('occurred_at', `${filters.from}T00:00:00Z`);
  if (filters.to) query = query.lte('occurred_at', `${filters.to}T23:59:59Z`);

  const from = (Math.max(1, filters.page) - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) fail('audit lookup', error);
  const total = count ?? 0;
  return { rows: (data ?? []) as AuditRow[], total, page: Math.max(1, filters.page), totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Structured audit metadata with anything that could be a secret or personal data redacted. */
export function redactDetails(details: Record<string, unknown>): Record<string, unknown> {
  const sensitive = /email|token|secret|password|answer|code|phone|name/i;
  return Object.fromEntries(
    Object.entries(details ?? {}).map(([k, v]) => [k, sensitive.test(k) && !k.endsWith('_hash') ? '[REDACTED]' : v]),
  );
}

export const shortId = (id: string | null) => (id ? `${id.slice(0, 8)}…` : '—');
export { formatDateTime };

// ---------------------------------------------------------------- ADM-05 Report Operations

export interface ReportFilters {
  status?: 'generating' | 'completed' | 'failed';
  version?: string;
  from?: string;
  to?: string;
  page: number;
}

export interface ReportOpsRow {
  id: string;
  assessmentId: string;
  reference: string | null;
  pseudonym: string;
  reportVersion: string;
  questionnaireVersion: string | null;
  status: 'generating' | 'completed' | 'failed';
  failureCode: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A report stuck in "generating" this long is treated as recoverable. */
export const STALE_GENERATING_MS = 5 * 60 * 1000;

export async function listReports(supabase: SupabaseClient, filters: ReportFilters) {
  let query = supabase
    .from('reports')
    .select('id, assessment_id, report_reference, report_version, status, generated_at, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.version) query = query.eq('report_version', filters.version);
  if (filters.from) query = query.gte('created_at', `${filters.from}T00:00:00Z`);
  if (filters.to) query = query.lte('created_at', `${filters.to}T23:59:59Z`);

  const from = (Math.max(1, filters.page) - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) fail('report lookup', error);

  const ids = (data ?? []).map((r) => r.assessment_id as string);
  const { data: assessments, error: aError } = ids.length
    ? await supabase.from('assessments').select('id, profile_id, questionnaire_version').in('id', ids)
    : { data: [], error: null };
  if (aError) fail('assessment lookup', aError);
  const byId = new Map((assessments ?? []).map((a) => [a.id as string, a]));

  // generation_metadata is not readable through the API (it may carry narrative data later);
  // only the failure code is read, with the service role, for failed reports on this page.
  const failedIds = (data ?? []).filter((r) => r.status === 'failed').map((r) => r.id as string);
  const { data: failures } = failedIds.length
    ? await getSupabaseAdmin().from('reports').select('id, failure_code:generation_metadata->>failure_code').in('id', failedIds)
    : { data: [] };
  const failureById = new Map((failures ?? []).map((f) => [f.id as string, (f.failure_code as string | null) ?? null]));

  const rows: ReportOpsRow[] = (data ?? []).map((r) => {
    const a = byId.get(r.assessment_id as string);
    return {
      id: r.id as string,
      assessmentId: r.assessment_id as string,
      reference: (r.report_reference as string | null) ?? null,
      pseudonym: a ? pseudonym(a.profile_id as string) : '—',
      reportVersion: r.report_version as string,
      questionnaireVersion: (a?.questionnaire_version as string | undefined) ?? null,
      status: r.status as ReportOpsRow['status'],
      failureCode: failureById.get(r.id as string) ?? null,
      generatedAt: (r.generated_at as string | null) ?? null,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  });
  const total = count ?? 0;
  return { rows, total, page: Math.max(1, filters.page), totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function reportVersions(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.from('reports').select('report_version');
  return [...new Set((data ?? []).map((r) => r.report_version as string))].sort();
}

/** Recovery is offered for failed reports, and for ones stuck generating. Never for completed ones. */
export const isRecoverable = (r: Pick<ReportOpsRow, 'status' | 'updatedAt'>, now = Date.now()) =>
  r.status === 'failed' || (r.status === 'generating' && now - Date.parse(r.updatedAt) > STALE_GENERATING_MS);

/**
 * RPT-01 access, shared by the web report and its PDF: the signed-in owner only, a completed
 * report only, and only the exact stored report (its checksum is re-verified).
 *
 * The report row is read through the participant's own session (RLS). Staff could also see the
 * row, so ownership is checked explicitly. The answer-bearing canonical JSON is not readable
 * through the API at all (column privileges); it is fetched with the service role only after
 * the ownership check. Denials and integrity failures are audited here.
 */

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { audit } from '@/lib/audit';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { CanonicalReport } from './build';
import { reportChecksum } from './canonical';

export type OwnedReport =
  | { ok: true; report: CanonicalReport; row: { id: string; first_viewed_at: string | null } }
  | { ok: false; kind: 'unavailable' | 'service' };

export async function loadOwnedReport(supabase: SupabaseClient, userId: string, id: string, action: string): Promise<OwnedReport> {
  const { data: row, error } = await supabase
    .from('reports')
    .select('id, assessment_id, status, canonical_json_checksum, first_viewed_at')
    .eq('id', id)
    .maybeSingle();
  if (error) return { ok: false, kind: 'service' };
  const { data: owner } = row
    ? await supabase.from('assessments').select('profile_id').eq('id', row.assessment_id).maybeSingle()
    : { data: null };
  if (!row || row.status !== 'completed' || owner?.profile_id !== userId) {
    await audit({ action, result: 'denied', actorId: userId, objectType: 'report', details: { reason: 'unavailable' } });
    return { ok: false, kind: 'unavailable' };
  }

  const { data: content } = await getSupabaseAdmin().from('reports').select('canonical_json').eq('id', row.id).maybeSingle();
  if (!content?.canonical_json) return { ok: false, kind: 'service' };
  const report = content.canonical_json as CanonicalReport;
  // Integrity: only the exact report that was generated (C-03 §9 same stored hash).
  if (reportChecksum(report) !== row.canonical_json_checksum) {
    console.error('report checksum mismatch:', row.id);
    await audit({ action, result: 'failure', actorId: userId, objectType: 'report', objectId: row.id as string, details: { reason: 'checksum_mismatch' } });
    return { ok: false, kind: 'service' };
  }
  return { ok: true, report, row: { id: row.id as string, first_viewed_at: (row.first_viewed_at as string | null) ?? null } };
}

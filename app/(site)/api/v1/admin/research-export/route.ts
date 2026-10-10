/**
 * POST /api/v1/admin/research-export — ADM-09 generate an approved de-identified export.
 * Research Admin only, with an MFA verification in the last 15 minutes.
 *
 * { purpose, questionnaireVersion?, from?, to?, fields[] }
 *
 * The cohort is always limited to participants with active research consent. Generation is
 * refused unless both risk checks pass (minimum cell size, no direct identifiers). The file is
 * stored encrypted, expires after EXPORT_TTL_HOURS, and generation is audited with the
 * purpose, row count and checksum.
 */

import { z } from 'zod';
import { apiError, json, readJsonObject } from '@/lib/api/http';
import { requireStaffApi } from '@/lib/admin/guard';
import { audit } from '@/lib/audit';
import { buildExport, encrypt, purgeExpired } from '@/lib/research/export';
import { EXPORT_TTL_HOURS, normalizeFields } from '@/lib/research/fields';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.object({
  purpose: z.string().trim().min(3, 'Enter the approved project or purpose reference.').max(200),
  questionnaireVersion: z.string().trim().max(20).optional(),
  from: DateStr.optional(),
  to: DateStr.optional(),
  fields: z.array(z.string().max(40)).max(40).optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaffApi(['research_admin'], { recentMfa: true });
  if ('error' in auth) return auth.error;
  const actorId = auth.ctx.user.id;

  const parsed = Body.safeParse((await readJsonObject(request)) ?? {});
  if (!parsed.success) return apiError(400, 'INVALID_REQUEST', parsed.error.issues[0]?.message ?? 'Check the export request.');
  const { purpose, questionnaireVersion, from, to } = parsed.data;
  const fields = normalizeFields(parsed.data.fields);
  const criteria = { questionnaireVersion: questionnaireVersion || undefined, from, to };

  const admin = getSupabaseAdmin();
  await purgeExpired(admin);

  const result = await buildExport(admin, criteria, fields);
  if (!result.risk.ok) {
    await audit({ action: 'research.export.generated', result: 'denied', actorType: 'admin', actorId, details: { purpose, reason: 'risk_check', row_count: result.rowCount } });
    return apiError(422, 'RISK_CHECK_FAILED', 'Generation is blocked: the risk checks did not pass.', result.risk);
  }

  const expiresAt = new Date(Date.now() + EXPORT_TTL_HOURS * 3600 * 1000).toISOString();
  const { data, error } = await admin
    .from('research_exports')
    .insert({ requested_by: actorId, purpose_reference: purpose, criteria, fields, row_count: result.rowCount, checksum: result.checksum, payload: encrypt(result.csv), expires_at: expiresAt })
    .select('id')
    .single();
  if (error || !data) {
    console.error('research export save failed:', error?.message);
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The export could not be created. Please try again.');
  }

  await audit({
    action: 'research.export.generated',
    result: 'success',
    actorType: 'admin',
    actorId,
    objectType: 'research_export',
    objectId: data.id as string,
    details: { purpose, row_count: result.rowCount, checksum: result.checksum, fields: fields.length, expires_at: expiresAt },
  });
  return json({ id: data.id, rowCount: result.rowCount, checksum: result.checksum, expiresAt }, 201);
}

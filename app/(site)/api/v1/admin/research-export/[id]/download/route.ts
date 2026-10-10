/**
 * GET /api/v1/admin/research-export/{id}/download — download an export file (ADM-09).
 * Research Admin only, and only the person who generated it, only before it expires. Each
 * download is audited. Expired files have already been destroyed.
 */

import { NextResponse } from 'next/server';
import { apiError, UUID_PATTERN } from '@/lib/api/http';
import { requireStaffApi } from '@/lib/admin/guard';
import { audit } from '@/lib/audit';
import { decrypt, purgeExpired } from '@/lib/research/export';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffApi(['research_admin']);
  if ('error' in auth) return auth.error;
  const actorId = auth.ctx.user.id;

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return apiError(404, 'NOT_FOUND', 'Export not found.');

  const admin = getSupabaseAdmin();
  await purgeExpired(admin);
  const { data: row } = await admin.from('research_exports').select('id, requested_by, payload, expires_at, checksum').eq('id', id).maybeSingle();
  if (!row || row.requested_by !== actorId) {
    await audit({ action: 'research.export.downloaded', result: 'denied', actorType: 'admin', actorId, objectType: 'research_export', objectId: id, details: { reason: row ? 'not_requester' : 'not_found' } });
    return apiError(404, 'NOT_FOUND', 'Export not found.');
  }
  if (!row.payload || Date.parse(row.expires_at as string) <= Date.now()) {
    return apiError(410, 'EXPIRED', 'This export has expired and its file has been destroyed. Generate a new export.');
  }

  let csv: string;
  try {
    csv = decrypt(row.payload as string);
  } catch {
    console.error('research export decrypt failed');
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The export could not be read.');
  }

  await audit({ action: 'research.export.downloaded', result: 'success', actorType: 'admin', actorId, objectType: 'research_export', objectId: id, details: { checksum: row.checksum as string } });
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="roots-ai-research-export-${id.slice(0, 8)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

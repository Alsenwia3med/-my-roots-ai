/**
 * GET /api/v1/reports/{id}/pdf — the participant's report as a PDF, generated on the server
 * from the same stored canonical JSON as the web report (C-03 §9). Same access rule as the web
 * report (RPT-01: owner only, completed only, checksum verified); every download is audited.
 */

import { NextResponse } from 'next/server';
import { apiError, requireParticipant, UUID_PATTERN } from '@/lib/api/http';
import { LIMITS, rateLimited } from '@/lib/api/rateLimit';
import { audit } from '@/lib/audit';
import { loadOwnedReport } from '@/lib/report/access';
import { renderReportPdf } from '@/lib/report/pdf';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return apiError(404, 'NOT_FOUND', 'Report not found.');

  const auth = await requireParticipant();
  if ('unauthorized' in auth) return auth.unauthorized;
  const { supabase, user } = auth;

  const limited = await rateLimited(user.id, LIMITS.pdfDownload);
  if (limited) return limited;

  const owned = await loadOwnedReport(supabase, user.id, id, 'report.pdf.downloaded');
  if (!owned.ok) {
    return owned.kind === 'service'
      ? apiError(503, 'SERVICE_UNAVAILABLE', 'The report could not be opened right now. Please try again later.')
      : apiError(404, 'NOT_FOUND', 'Report not found.');
  }

  let pdf: Uint8Array;
  try {
    pdf = await renderReportPdf(owned.report);
  } catch (e) {
    console.error('report PDF failed:', e instanceof Error ? e.message : e);
    await audit({ action: 'report.pdf.downloaded', result: 'failure', actorId: user.id, objectType: 'report', objectId: id, details: { reason: 'render_failed' } });
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The PDF could not be prepared. Please try again later.');
  }

  await audit({ action: 'report.pdf.downloaded', result: 'success', actorId: user.id, objectType: 'report', objectId: id });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${owned.report.report_id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}

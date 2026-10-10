/**
 * Canonical report PDF endpoint.
 *
 * Contractual requirement (M3 §5): the PDF must render from the SAME stored
 * canonical report object as the web report. It must not independently
 * recalculate or reinterpret the deterministic result.
 *
 * This route therefore:
 *   1. Reads the stored canonical report (never recomputes scores).
 *   2. Re-verifies the deterministic content hash before rendering.
 *   3. Renders all governed sections from the stored record with the required
 *      metadata (report id, generated timestamp, versions, educational and
 *      non-diagnostic boundary).
 *
 * The approved visual composition still requires a separate visual-regression
 * review, but the route now produces a real PDF from the canonical record.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCanonicalReportByAssessment, getSession } from "@/lib/db";
import { assertReportIntegrity } from "@/lib/report/pipeline";
import { ReportPdf } from "@/lib/report/pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const sessionCookie = (await cookies()).get("roots_session_id")?.value;
  if (sessionCookie !== sessionId) {
    return NextResponse.json(
      { error: "Session unavailable." },
      { status: 403 },
    );
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const stored = await getCanonicalReportByAssessment(sessionId);
  if (!stored) {
    return NextResponse.json(
      { error: "No stored canonical report. Request the report first." },
      { status: 404 },
    );
  }

  // Same-source guarantee is enforced, not assumed.
  assertReportIntegrity(stored.report);

  try {
    const { report } = stored;
    const document = createElement(ReportPdf, { report }) as unknown as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(document);
    const body = new Uint8Array(buffer).buffer as ArrayBuffer;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="roots-report-${report.report_id}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Report-Id": report.report_id,
        "X-Report-Content-Hash": report.contentHash,
        "X-Report-Same-Source": "canonical",
        "X-Report-Version": report.report_template_version,
      },
    });
  } catch (error) {
    console.error("Canonical PDF generation failed", error);
    return NextResponse.json({ error: "The report document could not be prepared." }, { status: 500 });
  }
}

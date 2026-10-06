import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getCanonicalReportByAssessment,
  getSession,
  saveCanonicalReport,
} from "@/lib/db";
import { calculateScores } from "@/lib/scoring";
import { validateAnswers } from "@/lib/canonicalAssessment";
import { assertReportIntegrity, generateReport } from "@/lib/report/pipeline";

/**
 * Authorized canonical report endpoint.
 *
 * This route is the SINGLE authoritative source for report rendering. The web
 * report page and the PDF route both read the stored canonical object from here
 * and neither recalculates or reinterprets the deterministic result
 * (M3 requirement 5).
 *
 * Authorization mirrors the assessment routes: the caller must present the
 * session cookie that owns this assessment. A cross-user read is rejected
 * before any report data is touched.
 */

async function authorize(sessionId: string) {
  const sessionCookie = (await cookies()).get("roots_session_id")?.value;
  if (sessionCookie !== sessionId) {
    return {
      error: NextResponse.json(
        { error: "Session unavailable." },
        { status: 403 },
      ),
    };
  }
  const session = await getSession(sessionId);
  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Session not found." },
        { status: 404 },
      ),
    };
  }
  return { session };
}

/** GET: return the stored canonical report, generating it once if absent. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const authorized = await authorize(sessionId);
  if ("error" in authorized) return authorized.error;

  const existing = await getCanonicalReportByAssessment(sessionId);
  if (existing) {
    // Integrity is re-verified on every read. A tampered or corrupted stored
    // report is never served.
    try {
      assertReportIntegrity(existing.report);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Stored report failed integrity verification.",
          detail: error instanceof Error ? error.message : String(error),
        },
        { status: 409 },
      );
    }
    return NextResponse.json(existing);
  }

  const { session } = authorized;
  const validationErrors = validateAnswers(session.answers);
  if (validationErrors.length > 0) {
    return NextResponse.json(
      {
        error: "Assessment is not complete; no report can be produced.",
        validationErrors,
      },
      { status: 400 },
    );
  }

  const generated = await generateReport(sessionId, session.answers, {
    // No narrative transport is configured, so the governed fallback is applied
    // and the deterministic result is preserved in full.
  });
  assertReportIntegrity(generated.report);

  const record = {
    id: sessionId,
    assessmentId: sessionId,
    report: generated.report,
    createdAt: new Date().toISOString(),
  };
  await saveCanonicalReport(record);
  return NextResponse.json(record, { status: 201 });
}

/**
 * POST: re-derive the deterministic result and confirm the stored report's hash
 * still matches. Returns 409 on divergence, which is the tamper-detection path.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const authorized = await authorize(sessionId);
  if ("error" in authorized) return authorized.error;

  const { session } = authorized;
  const stored = await getCanonicalReportByAssessment(sessionId);
  if (!stored) {
    return NextResponse.json(
      { error: "No stored report to verify." },
      { status: 404 },
    );
  }

  const recomputed = calculateScores(session.answers);
  const matchesStored =
    JSON.stringify(recomputed) === JSON.stringify(stored.report.scoring);

  return NextResponse.json(
    {
      storedContentHash: stored.report.contentHash,
      deterministicPartMatches: matchesStored,
      integrityVerified: (() => {
        try {
          assertReportIntegrity(stored.report);
          return true;
        } catch {
          return false;
        }
      })(),
    },
    { status: matchesStored ? 200 : 409 },
  );
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getProgress } from "@/lib/db";
import { allQuestions, assessmentModules } from "@/lib/canonicalAssessment";

/**
 * Deterministic assessment progress.
 *
 * Progress is derived from persisted answers, so refresh, leaving the
 * assessment, signing back in and resuming cannot corrupt completed answers,
 * progress or question state.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const sessionCookie = (await cookies()).get("roots_session_id")?.value;
  if (sessionCookie !== sessionId)
    return NextResponse.json(
      { error: "Session unavailable." },
      { status: 403 },
    );

  const moduleOrder = assessmentModules.map((m) => m.id);
  const requiredQuestionIds = allQuestions
    .filter((q) => q.required)
    .map((q) => q.id);

  const isValidAnswer = (questionId: string, value: unknown): boolean => {
    const question = allQuestions.find((q) => q.id === questionId);
    if (!question) return false;
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  };

  const progress = await getProgress(
    sessionId,
    allQuestions.length,
    requiredQuestionIds.length,
    moduleOrder,
    requiredQuestionIds,
    isValidAnswer,
  );

  if (!progress)
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  return NextResponse.json(progress);
}

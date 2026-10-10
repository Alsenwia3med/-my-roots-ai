/**
 * PUT /api/v1/assessments/{id}/responses — autosave (C-05 ASM-06 zone 6; Master Requirements 5.1).
 *
 * Body: { answers: [{ question_id, value }], currentModule }
 *   value = participant answer (see RawAnswer) or null to clear an answer.
 * Every value is validated against C-01 on the server; valid answers are saved, invalid ones are
 * returned in `errors` with the approved C-01 message. The response carries the server
 * timestamp, which is the only basis for the "Saved" state in the browser.
 */

import { apiError, json, readJsonObject, requireParticipant, UUID_PATTERN } from '@/lib/api/http';
import { QUESTIONNAIRE_VERSION, getQuestion } from '@/lib/assessment/questionBank';
import { progressPercent } from '@/lib/assessment/progress';
import { getOwnedAssessment, loadAnswers } from '@/lib/assessment/store';
import { validateAnswer } from '@/lib/assessment/validation';

export const dynamic = 'force-dynamic';

const MAX_ANSWERS_PER_SAVE = 20;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return apiError(404, 'NOT_FOUND', 'Assessment not found.');

  const auth = await requireParticipant();
  if ('unauthorized' in auth) return auth.unauthorized;
  const { supabase } = auth;

  const assessment = await getOwnedAssessment(supabase, id);
  if (!assessment) return apiError(404, 'NOT_FOUND', 'Assessment not found.');
  if (assessment.status !== 'in_progress') {
    return apiError(409, 'ASSESSMENT_CLOSED', 'This assessment can no longer be changed.', { status: assessment.status });
  }

  const body = await readJsonObject(request);
  const answers = Array.isArray(body?.answers) ? body.answers : null;
  if (!answers || answers.length === 0 || answers.length > MAX_ANSWERS_PER_SAVE) {
    return apiError(400, 'INVALID_REQUEST', 'Provide between 1 and 20 answers.');
  }

  const upserts: Record<string, unknown>[] = [];
  const clears: string[] = [];
  const errors: Record<string, { rule: string; message: string }> = {};
  const now = new Date().toISOString();

  for (const item of answers as { question_id?: unknown; value?: unknown }[]) {
    const questionId = typeof item?.question_id === 'string' ? item.question_id : '';
    if (!getQuestion(questionId)) return apiError(400, 'INVALID_REQUEST', 'Unknown question.');
    if (item.value === null) {
      clears.push(questionId);
      continue;
    }
    const result = validateAnswer(questionId, item.value);
    if (!result.ok) {
      errors[questionId] = { rule: result.rule, message: result.message };
      continue;
    }
    upserts.push({
      assessment_id: id,
      question_id: questionId,
      raw_value: result.answer.raw_value,
      normalized_value: result.answer.normalized_value,
      is_na: result.answer.is_na,
      validation_state: 'valid',
      source_version: QUESTIONNAIRE_VERSION,
      answered_at: now,
    });
  }

  if (upserts.length) {
    const { error } = await supabase.from('responses').upsert(upserts, { onConflict: 'assessment_id,question_id' });
    if (error) {
      console.error('response save failed:', error.message);
      return apiError(503, 'SAVE_FAILED', 'Answers could not be saved.');
    }
  }
  if (clears.length) {
    const { error } = await supabase.from('responses').delete().eq('assessment_id', id).in('question_id', clears);
    if (error) {
      console.error('response clear failed:', error.message);
      return apiError(503, 'SAVE_FAILED', 'Answers could not be saved.');
    }
  }

  const saved = await loadAnswers(supabase, id);
  const progress = progressPercent(Object.keys(saved));
  const requestedModule = Number(body?.currentModule);
  const currentModule = Number.isInteger(requestedModule) && requestedModule >= 1 && requestedModule <= 13 ? requestedModule : assessment.current_module;

  const { error: updateError } = await supabase
    .from('assessments')
    .update({ last_saved_at: now, progress_percent: progress, current_module: currentModule })
    .eq('id', id);
  if (updateError) console.error('assessment progress update failed:', updateError.message);

  return json({
    saved: upserts.map((u) => u.question_id),
    cleared: clears,
    errors,
    saved_at: now,
    progress_percent: progress,
  });
}

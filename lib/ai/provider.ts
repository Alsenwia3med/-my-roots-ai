/**
 * The narrative provider call (Regulatory Readiness Annex AI-07 "Timeout, retry and
 * deterministic fallback prevent indefinite waiting and preserve numerical output", AI-10
 * "Production content is not used for provider training").
 *
 * One HTTP request, with an abort timeout and no client library, so nothing is installed that
 * could reach further than this function. The call is the AI path's only I/O: it has no database
 * client and no write capability of any kind, which is how AI-03 holds in the application layer
 * (the database grants prove it independently).
 *
 * AI-10 is an account setting, not a request header: the OpenAI API does not train on API
 * traffic by default, and the approved ROOTS-AI account must keep that default. `store: false`
 * additionally asks the provider not to retain the exchange for its own tooling.
 *
 * The prompt is assembled from the read-only projection only. Q73 free text is never included
 * (C-03 §7) — the projection carries a boolean, so the Final Word can acknowledge that a comment
 * exists without the model being shown it.
 */

import 'server-only';
import { apiKey, model, REQUEST_TIMEOUT_MS } from './config';
import { NarrativeProviderError } from './orchestrate';
import type { NarrativeProjection } from './projection';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

/**
 * The governed system instruction. It states the boundary in the same terms as the controlled
 * sources, so the model is told what it is for as well as constrained afterwards by validation.
 */
export const SYSTEM_PROMPT = [
  'You write the governed narrative sections of the ROOTS Biological Intelligence Report, an educational, non-diagnostic wellness report.',
  '',
  'All scores, classifications and drivers have ALREADY been calculated by a deterministic engine. You are describing finished results. You never calculate, estimate, adjust, rank or restate a value.',
  '',
  'Rules, all mandatory:',
  '1. Never write any digit. Every number in the report is rendered separately from the stored result. Refer to areas by name, not by score.',
  '2. Never diagnose, name a disease, disorder or syndrome, or say "you have" anything.',
  '3. Never recommend or mention treatment, therapy, medication, supplements, dosage or a cure.',
  '4. Never promise, guarantee or predict an outcome, and never say something is proven or certain.',
  '5. Never state a cause. These are self-reported patterns and associations. Use "may", "might", "suggests", "possible" or "potential".',
  '6. Never use alarming language or give emergency instructions. Fixed approved copy elsewhere covers that.',
  '7. Describe only what appears in the supplied data. Never invent a finding, a test result or a symptom.',
  '8. Where information is missing, say so plainly. Never fill a gap with an assumption.',
  '',
  'Reply with JSON only, matching exactly:',
  '{"executive_summary": [string, string], "future_projection": [string, string, string], "final_word": string}',
  '',
  'executive_summary: exactly two short paragraphs, 90-160 words in total. Mention the overall state, the main reported areas, one strength and a limitation of confidence.',
  'future_projection: three conditional sentences about what may continue or change. Each must be conditional.',
  'final_word: 50-100 words. Encourage one realistic action and observing the response. Close warmly without promising anything.',
].join('\n');

/** The projection as the model sees it — plain JSON, no instructions embedded in the data. */
export function userMessage(projection: NarrativeProjection): string {
  return [
    'Report data (already calculated, read-only):',
    JSON.stringify(projection, null, 2),
    '',
    projection.free_text_present
      ? 'The participant also left a free-text comment. Its content is deliberately not shown to you. You may acknowledge that they shared something in their own words, but never guess what it said.'
      : 'The participant left no free-text comment. Do not refer to one.',
  ].join('\n');
}

/** Raw model output. Validation and the governed language check happen in narrative.ts. */
export async function requestNarrative(projection: NarrativeProjection): Promise<string> {
  const key = apiKey();
  if (!key) throw new NarrativeProviderError('OPENAI_API_KEY is not configured', 'not_configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: model(),
        // Low temperature: the narrative describes a fixed result, so variation adds no value.
        temperature: 0.3,
        max_tokens: 900,
        response_format: { type: 'json_object' },
        store: false,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage(projection) },
        ],
      }),
    });

    if (!response.ok) {
      // The body can echo the request, so only the status is recorded.
      throw new NarrativeProviderError(`provider returned ${response.status}`, 'provider_error');
    }

    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new NarrativeProviderError('provider returned no content', 'provider_error');
    return content;
  } catch (e) {
    if (e instanceof NarrativeProviderError) throw e;
    if (e instanceof Error && e.name === 'AbortError') throw new NarrativeProviderError('provider timed out', 'timeout');
    throw new NarrativeProviderError(e instanceof Error ? e.message : 'provider request failed', 'provider_error');
  } finally {
    clearTimeout(timer);
  }
}

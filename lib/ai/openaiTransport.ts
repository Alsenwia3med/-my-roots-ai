import type { NarrativeTransport } from "@/lib/ai/boundary";

/**
 * Optional server-side OpenAI transport for governed narrative generation.
 *
 * The transport receives only the read-only scoring projection. Raw answers,
 * credentials and storage handles never cross this boundary. The API key is
 * read only on the server and is never returned to the browser.
 */
export function createOpenAiTransport(): NarrativeTransport | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.AI_NARRATIVE_MODEL?.trim();
  if (!apiKey || !model) return null;

  return async (projection, signal) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write bounded educational report language only. Return JSON with exactly one top-level key named sections. Each section must contain only index and narrative. Do not include scores, diagnoses, treatment, medication, eligibility, or any other authoritative fields. Use cautious language and preserve uncertainty.",
          },
          {
            role: "user",
            content: JSON.stringify({
              sectionCount: 19,
              projection,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("OpenAI returned no narrative content.");
    }

    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new Error("OpenAI returned malformed narrative JSON.");
    }
  };
}

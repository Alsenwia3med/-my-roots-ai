/**
 * Governed language validation (Regulatory Readiness Annex AI-05: "Prohibited diagnostic,
 * prescriptive, alarmist and certainty language is validated and rejected or replaced by
 * approved fallback").
 *
 * C-03 §7 names what is prohibited — "you have", "this proves", diagnosis, cure, treatment,
 * medication change, guaranteed outcome, invented test result, invented fact, or emergency
 * triage beyond the fixed approved text — and what framing is required: may, suggests, appears
 * consistent with, possible or potential, wherever causality is uncertain.
 *
 * The check runs on generated prose only. Approved C-03 copy is never passed through it: the
 * disclaimer legitimately contains words such as "diagnostic" and "emergency services", and it
 * is controlled text that must appear verbatim.
 *
 * A failure is never repaired by editing the text — a rewritten sentence would no longer be
 * governed copy. The narrative is rejected and the approved deterministic fallback is used
 * instead (C-03 §7, acceptance check RPT-07).
 */


export interface LanguageRule {
  /** Why this wording is not permitted, for the rejection record. */
  category: 'diagnostic' | 'prescriptive' | 'certainty' | 'alarmist' | 'causal';
  pattern: RegExp;
}

export const PROHIBITED: readonly LanguageRule[] = [
  // Diagnostic — C-03 §7 "you have", diagnosis; the report describes answers, never a condition.
  { category: 'diagnostic', pattern: /\byou (?:have|suffer from|are suffering|have got)\b/i },
  { category: 'diagnostic', pattern: /\bdiagnos(?:e|es|ed|is|ing|tic)\b/i },
  { category: 'diagnostic', pattern: /\b(?:disease|disorder|syndrome|pathology|illness)\b/i },
  { category: 'diagnostic', pattern: /\b(?:diabetes|hypothyroid|apnoea|apnea|depression|anxiety disorder)\b/i },

  // Prescriptive — no treatment, medication or dosage instruction may appear.
  { category: 'prescriptive', pattern: /\b(?:prescribe|prescription|dosage|dose|medication|supplement)\b/i },
  { category: 'prescriptive', pattern: /\b(?:treat|treats|treatment|therapy|cure|cures|heal|remedy)\b/i },
  { category: 'prescriptive', pattern: /\b(?:you must|you need to|you should take|stop taking)\b/i },

  // Certainty — C-03 §7 "this proves", guaranteed outcome.
  { category: 'certainty', pattern: /\b(?:this proves|proves|proven|guarantee|guaranteed|certainly|definitely|undoubtedly)\b/i },
  { category: 'certainty', pattern: /\b(?:will (?:improve|worsen|resolve|fix|reverse)|always results?|never results?)\b/i },

  // Alarmist — including emergency triage beyond the fixed approved disclaimer text.
  { category: 'alarmist', pattern: /\b(?:dangerous|life-threatening|critical condition|seek emergency|call an ambulance|medical emergency)\b/i },
  { category: 'alarmist', pattern: /\b(?:at (?:serious |high )?risk of|you are in danger)\b/i },

  // Causal — the engine establishes association and pattern, never causation (review point 23).
  { category: 'causal', pattern: /\b(?:causes|caused by|causing|leads to|results in|is responsible for)\b/i },
  { category: 'causal', pattern: /\bbecause (?:of )?your\b/i },
];

/** C-03 §7 required framing wherever causality is uncertain. */
export const HEDGES: readonly RegExp[] = [
  /\bmay\b/i,
  /\bmight\b/i,
  /\bsuggests?\b/i,
  /\bappears? consistent with\b/i,
  /\bpossible\b/i,
  /\bpotential(?:ly)?\b/i,
  /\bcould\b/i,
];

export interface LanguageFinding {
  category: LanguageRule['category'];
  match: string;
}

/** Every prohibited phrase in the text, so a rejection can say exactly what was wrong. */
export function findProhibited(text: string): LanguageFinding[] {
  const findings: LanguageFinding[] = [];
  for (const rule of PROHIBITED) {
    const m = rule.pattern.exec(text);
    if (m) findings.push({ category: rule.category, match: m[0] });
  }
  return findings;
}

export function hasHedge(text: string): boolean {
  return HEDGES.some((h) => h.test(text));
}

export type LanguageResult = { ok: true } | { ok: false; reason: string };

/**
 * Sections whose wording must stay conditional. The Executive Summary interprets a pattern and
 * the Future Projection describes what may follow, so both require hedging (C-03 §4.9 "Use 3-4
 * conditional bullets"). The Final Word is a closing instruction to observe and seek support,
 * which C-03 states plainly, so no hedge is demanded of it.
 */
export function checkNarrativeLanguage(parts: { executive_summary: string[]; future_projection: string[]; final_word: string }): LanguageResult {
  const all = [...parts.executive_summary, ...parts.future_projection, parts.final_word];

  for (const text of all) {
    const findings = findProhibited(text);
    if (findings.length) {
      return { ok: false, reason: `prohibited ${findings[0].category} language: "${findings[0].match}"` };
    }
  }

  if (!hasHedge(parts.executive_summary.join(' '))) return { ok: false, reason: 'executive_summary states a pattern without required conditional framing' };
  if (!hasHedge(parts.future_projection.join(' '))) return { ok: false, reason: 'future_projection is not conditional (C-03 §4.9)' };

  return { ok: true };
}

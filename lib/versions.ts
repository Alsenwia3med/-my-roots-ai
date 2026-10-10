/**
 * M2 item 7 — the controlled sources behind every assessment and every score.
 *
 * Two identifiers are kept side by side, both exactly as the workbooks state them:
 *   - the data version written inside each workbook (questionnaire_version 1.0.0 in C-01,
 *     scoring_version 1.0.1 in C-02), which the application has always stored; and
 *   - the controlled document the data was generated from ("C-01 v1.0.1 CORRECTED",
 *     "C-02 v1.0.1 CORRECTED"), with the workbook's SHA-256.
 *
 * Both come from the generated JSON (scripts/canonical/generate.py), never from hand-typed
 * values, so a stored result can always be traced to — and reproduced from — the exact workbook.
 */

import bank from './assessment/c01-question-bank.json';
import ruleset from './scoring/c02-ruleset.json';

export interface SourceRef {
  /** Human-readable controlled source, e.g. "C-01 v1.0.1 CORRECTED". */
  label: string;
  dataset_id: string;
  document: string;
  document_version: string;
  sha256: string;
}

export interface C01Ref extends SourceRef {
  questionnaire_version: string;
}

export interface C02Ref extends SourceRef {
  scoring_version: string;
}

export const C01_SOURCE: C01Ref = {
  label: `C-01 v${bank.source.document_version}`,
  dataset_id: bank.dataset_id,
  questionnaire_version: bank.questionnaire_version,
  document: bank.source.document,
  document_version: bank.source.document_version,
  sha256: bank.source.sha256,
};

export const C02_SOURCE: C02Ref = {
  label: `C-02 v${ruleset.source.document_version}`,
  dataset_id: ruleset.dataset_id,
  scoring_version: ruleset.scoring_version,
  document: ruleset.source.document,
  document_version: ruleset.source.document_version,
  sha256: ruleset.source.sha256,
};

/** Stamped on an assessment when it starts: the question bank it is answered against. */
export const ASSESSMENT_SOURCE_VERSIONS = { c01: C01_SOURCE } as const;

/** Stamped on a score row when it is calculated: the question bank and the scoring rules. */
export const SCORING_SOURCE_VERSIONS = { c01: C01_SOURCE, c02: C02_SOURCE } as const;

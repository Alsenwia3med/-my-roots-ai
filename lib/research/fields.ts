/**
 * ADM-09 research export — the allow-list, the risk gate and the CSV format. Pure: no server
 * imports, so the rules can be tested directly.
 *
 * Only these pseudonymised fields can ever be exported. There is no free-form column choice:
 * a field not listed here cannot be requested, and none of them is a direct identifier (no
 * email, name, account ID, IP address, free text or raw answer). Dates are coarsened to the
 * month to reduce re-identification risk.
 */

export const EXPORT_FIELDS = [
  { key: 'research_id', label: 'Research ID (export-specific pseudonym)', required: true },
  { key: 'questionnaire_version', label: 'Questionnaire version' },
  { key: 'scoring_version', label: 'Scoring version' },
  { key: 'submitted_month', label: 'Submitted month (YYYY-MM)' },
  { key: 'mr_score', label: 'Metabolic Resistance' },
  { key: 'sr_score', label: 'Sleep Recovery' },
  { key: 'hs_score', label: 'Hunger & Satiety' },
  { key: 'sl_score', label: 'Stress Load' },
  { key: 'ib_score', label: 'Inflammation Burden' },
  { key: 'ch_score', label: 'Circadian Health' },
  { key: 'bs_score', label: 'Biological Safety' },
  { key: 'biological_state', label: 'Biological State' },
  { key: 'opportunity_score', label: 'Opportunity' },
  { key: 'recovery_potential', label: 'Recovery Potential' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'confidence_label', label: 'Confidence label' },
  { key: 'protective_count', label: 'Protective factor count' },
  { key: 'primary_driver', label: 'Primary driver' },
  { key: 'secondary_driver', label: 'Secondary driver' },
  { key: 'tertiary_driver', label: 'Tertiary driver' },
] as const;

export type ExportField = (typeof EXPORT_FIELDS)[number]['key'];

export const EXPORT_FIELD_KEYS: readonly ExportField[] = EXPORT_FIELDS.map((f) => f.key);

/** Minimum cohort size. Smaller cohorts are refused: individuals could be singled out. */
export const MIN_CELL_SIZE = 10;

/** How long an export file can be downloaded before it is destroyed. */
export const EXPORT_TTL_HOURS = 24;

/** Anything that looks like a direct identifier is refused even if it were ever allow-listed. */
const IDENTIFIER_PATTERN = /email|name|phone|address|(^|_)ip(_|$)|profile_id|user_id|account|answer|token|dob|birth/i;

export interface RiskCheck {
  cellSize: { ok: boolean; rows: number; min: number };
  directIdentifiers: { ok: boolean; rejected: string[] };
  ok: boolean;
}

export function riskCheck(rowCount: number, fields: readonly string[]): RiskCheck {
  const rejected = fields.filter((f) => !(EXPORT_FIELD_KEYS as readonly string[]).includes(f) || (f !== 'research_id' && IDENTIFIER_PATTERN.test(f)));
  const cellSize = { ok: rowCount >= MIN_CELL_SIZE, rows: rowCount, min: MIN_CELL_SIZE };
  const directIdentifiers = { ok: rejected.length === 0 && fields.length > 0, rejected };
  return { cellSize, directIdentifiers, ok: cellSize.ok && directIdentifiers.ok };
}

/** Requested fields reduced to the allow-list, in allow-list order, always with research_id. */
export function normalizeFields(requested: readonly string[] | undefined): ExportField[] {
  const wanted = new Set(requested ?? EXPORT_FIELD_KEYS);
  return EXPORT_FIELD_KEYS.filter((k) => k === 'research_id' || wanted.has(k));
}

const csvCell = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // Spreadsheet formula injection: a cell starting with = + - @ is executed by Excel.
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(fields: readonly ExportField[], rows: readonly Record<string, unknown>[]): string {
  return [fields.join(','), ...rows.map((r) => fields.map((f) => csvCell(r[f])).join(','))].join('\r\n') + '\r\n';
}

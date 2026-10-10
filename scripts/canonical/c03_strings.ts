/**
 * Prints every participant-facing string in lib/report/c03-content.ts as JSON, with the export
 * it belongs to. Used by check_c03.py to classify each one as ROOTS-issued or vendor-drafted.
 *
 * The module's own structure decides what counts as report copy, rather than a regex over the
 * source guessing at it. Identifiers that are not prose — version numbers, the document ID, the
 * domain display order — are left out, because there is nothing to approve in them.
 */

import {
  CLASSIFICATION_EXPLANATIONS,
  CONFIDENCE_COMPOSITE_NOTE,
  CONFIDENCE_NOTE,
  COPY,
  DOMAIN_DIRECTION_NOTE,
  DOMAIN_LABELS,
  DOMAIN_MEANINGS,
  DRIVER_NOTE,
  EDUCATIONAL_BADGE,
  LAB_LIBRARY,
  MICRO_ACTIONS,
  PARTICIPANT_FALLBACK,
  PROTECTIVE_LABELS,
  REPORT_TITLE,
  SECTION_TITLES,
  TRIAD_DIAGRAM_LABEL,
  TRIAD_KIND_LABELS,
  TRIAD_NOTE,
  WHY,
  WHY_HEADING,
} from '../../lib/report/c03-content';

const out: [string, string][] = [];
const add = (path: string, value: string) => out.push([path, value]);

add('REPORT_TITLE', REPORT_TITLE);
add('EDUCATIONAL_BADGE', EDUCATIONAL_BADGE);
add('PARTICIPANT_FALLBACK', PARTICIPANT_FALLBACK);

for (const [id, label] of Object.entries(DOMAIN_LABELS)) add(`DOMAIN_LABELS.${id}`, label);
for (const [id, meaning] of Object.entries(DOMAIN_MEANINGS)) add(`DOMAIN_MEANINGS.${id}`, meaning);
for (const [k, text] of Object.entries(CLASSIFICATION_EXPLANATIONS)) add(`CLASSIFICATION_EXPLANATIONS.${k}`, text);
SECTION_TITLES.forEach((t, i) => add(`SECTION_TITLES[${i + 1}]`, t));

for (const [key, value] of Object.entries(COPY)) {
  if (Array.isArray(value)) value.forEach((v, i) => add(`COPY.${key}[${i}]`, v));
  else add(`COPY.${key}`, value as string);
}

for (const [k, v] of Object.entries(TRIAD_KIND_LABELS)) add(`TRIAD_KIND_LABELS.${k}`, v);
add('TRIAD_DIAGRAM_LABEL', TRIAD_DIAGRAM_LABEL);
add('TRIAD_NOTE', TRIAD_NOTE);
add('DRIVER_NOTE', DRIVER_NOTE);
add('CONFIDENCE_NOTE', CONFIDENCE_NOTE);
add('CONFIDENCE_COMPOSITE_NOTE', CONFIDENCE_COMPOSITE_NOTE);
add('DOMAIN_DIRECTION_NOTE', DOMAIN_DIRECTION_NOTE);
add('WHY_HEADING', WHY_HEADING);
for (const [k, v] of Object.entries(WHY)) add(`WHY.${k}`, v);

for (const [id, a] of Object.entries(MICRO_ACTIONS)) {
  add(`MICRO_ACTIONS.${id}.action`, a.action);
  add(`MICRO_ACTIONS.${id}.rationale`, a.rationale);
  add(`MICRO_ACTIONS.${id}.safety`, a.safety);
}

for (const [id, lab] of Object.entries(LAB_LIBRARY)) {
  add(`LAB_LIBRARY.${id}.discussion`, lab.discussion);
  // The implementer-facing entries are honoured as rules and never shown, so they are listed
  // with that fact rather than as participant copy.
  add(`LAB_LIBRARY.${id}.mandatory${lab.mandatoryShown ? '' : ' (not shown)'}`, lab.mandatory);
}

for (const [k, v] of Object.entries(PROTECTIVE_LABELS)) add(`PROTECTIVE_LABELS.${k}`, v);

process.stdout.write(JSON.stringify(out));

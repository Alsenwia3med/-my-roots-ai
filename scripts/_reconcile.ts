/**
 * Temporary reconciliation: diffs the generated canonical JSON (from the
 * controlled XLSX) against the hand-maintained lib/canonical/*.ts modules.
 * Read-only - reports deltas, changes nothing.
 */
import { readFileSync } from "node:fs";
import {
  allQuestions,
  assessmentModules,
  REQUIRED_MULTI_SELECT_QUESTIONS,
} from "@/lib/canonicalAssessment";
import { optionSets } from "@/lib/canonical/optionSets";
import {
  CANONICAL_VERSIONS,
  DOMAIN_TIE_ORDER,
  DOMAIN_MODEL,
  DOMAIN_LABELS,
} from "@/lib/canonical/source";
import { goldenTests } from "@/lib/canonical/goldenTests";
import { calculateScores } from "@/lib/scoring";

const gen = JSON.parse(
  readFileSync("lib/canonical/generated/canonical-source.json", "utf8"),
);
const findings: string[] = [];
const note = (s: string) => findings.push(s);

// ---- versions
console.log("== VERSIONS ==");
console.log("  generated:", JSON.stringify(gen.canonicalVersions));
console.log("  ts       :", JSON.stringify(CANONICAL_VERSIONS));
if (
  gen.canonicalVersions.questionnaire !== CANONICAL_VERSIONS.questionnaire ||
  gen.canonicalVersions.scoring !== CANONICAL_VERSIONS.scoring
) {
  note(
    `VERSIONS differ: XLSX=${JSON.stringify(gen.canonicalVersions)} TS=${JSON.stringify(CANONICAL_VERSIONS)}`,
  );
}

// ---- modules
console.log("\n== MODULES ==");
const gm = gen.modules as Array<Record<string, unknown>>;
const tm = assessmentModules;
if (gm.length !== tm.length) note(`module count ${gm.length} vs ${tm.length}`);
for (let i = 0; i < Math.max(gm.length, tm.length); i++) {
  const g = gm[i],
    t = tm[i];
  if (!g || !t) continue;
  for (const k of ["id", "order", "title", "purpose"] as const) {
    const gv = k === "id" ? g[k] : g[k];
    const tv =
      k === "purpose"
        ? t.purpose
        : (t as unknown as Record<string, unknown>)[k];
    if (String(gv) !== String(tv))
      note(`module ${g.id} ${k}: XLSX='${String(gv)}' TS='${String(tv)}'`);
  }
  if (
    t.firstQuestionOrder !== g.firstQuestionOrder ||
    t.lastQuestionOrder !== g.lastQuestionOrder
  ) {
    note(
      `module ${g.id} range: XLSX=${g.firstQuestionOrder}-${g.lastQuestionOrder} TS=${t.firstQuestionOrder}-${t.lastQuestionOrder}`,
    );
  }
}

// ---- questions
console.log("\n== QUESTIONS ==");
const gq = gen.questions as Array<Record<string, unknown>>;
const tq = allQuestions;
if (gq.length !== tq.length)
  note(`question count ${gq.length} vs ${tq.length}`);
const tqById = new Map(tq.map((q) => [q.id, q]));
const xlsxScored = gq
  .filter((q) => q.scoringEligible === true)
  .map((q) => String(q.id));
const tsScored = tq.filter((q) => q.scoringEligible).map((q) => q.id);
console.log("  scored XLSX:", xlsxScored.length, "TS:", tsScored.length);
const scoredDelta = [
  ...xlsxScored.filter((i) => !tsScored.includes(i)),
  ...tsScored.filter((i) => !xlsxScored.includes(i)),
];
if (scoredDelta.length)
  note(`scoring flag set differs: ${JSON.stringify(scoredDelta)}`);

const requiredX = gq
  .filter((q) => q.required === true)
  .map((q) => String(q.id));
const requiredT = tq.filter((q) => q.required).map((q) => q.id);
if (JSON.stringify(requiredX) !== JSON.stringify(requiredT)) {
  note(
    `required set differs: onlyXLSX=${JSON.stringify(requiredX.filter((i) => !requiredT.includes(i)))} onlyTS=${JSON.stringify(requiredT.filter((i) => !requiredX.includes(i)))}`,
  );
}

const multiSelectX = gq
  .filter((q) => q.type === "multi_select")
  .map((q) => String(q.id));
console.log(
  "  multi_select XLSX:",
  JSON.stringify(multiSelectX),
  "TS REQUIRED_MULTI_SELECT:",
  JSON.stringify(REQUIRED_MULTI_SELECT_QUESTIONS),
);

let domainMismatch = 0,
  reverseMismatch = 0,
  typeMismatch = 0,
  textMismatch = 0,
  optSetMismatch = 0,
  allowNaMismatch = 0,
  minMaxMismatch = 0;
for (const g of gq) {
  const t = tqById.get(String(g.id));
  if (!t) {
    note(`question ${g.id} missing in TS`);
    continue;
  }
  if (g.domain !== undefined && String(g.domain) !== String(t.domain)) {
    domainMismatch++;
    note(`Q ${g.id} domain XLSX='${g.domain}' TS='${t.domain}'`);
  }
  if (g.scoringEligible === true && g.reverseScored !== t.reverseScored) {
    reverseMismatch++;
    note(`Q ${g.id} reverse XLSX=${g.reverseScored} TS=${t.reverseScored}`);
  }
  if (String(g.type) !== String(t.type)) {
    typeMismatch++;
    note(`Q ${g.id} type XLSX='${g.type}' TS='${t.type}'`);
  }
  if (String(g.text).trim() !== String(t.text).trim()) {
    textMismatch++;
    note(`Q ${g.id} text differs`);
  }
  if (String(g.optionSetId ?? "") !== String(t.optionSetId ?? "")) {
    optSetMismatch++;
    note(`Q ${g.id} optionSetId XLSX='${g.optionSetId}' TS='${t.optionSetId}'`);
  }
  if (g.allowNa !== t.allowNa) {
    allowNaMismatch++;
    note(`Q ${g.id} allowNa XLSX=${g.allowNa} TS=${t.allowNa}`);
  }
  if (g.min !== t.min || g.max !== t.max) {
    minMaxMismatch++;
    if (/^\d/.test(String(g.validation)))
      note(
        `Q ${g.id} min/max XLSX=${g.min}-${g.max} TS=${t.min}-${t.max} (validation='${g.validation}')`,
      );
  }
}
console.log(
  "  domain mismatch:",
  domainMismatch,
  "| reverse:",
  reverseMismatch,
  "| type:",
  typeMismatch,
  "| text:",
  textMismatch,
  "| optionSet:",
  optSetMismatch,
  "| allowNa:",
  allowNaMismatch,
  "| minmax:",
  minMaxMismatch,
);

// ---- option sets
console.log("\n== OPTION SETS ==");
const gos = gen.optionSets as Array<{
  id: string;
  options: Array<Record<string, unknown>>;
}>;
const tsSetIds = Object.keys(optionSets);
const xSetIds = gos.map((s) => s.id);
console.log("  XLSX sets:", xSetIds.length, "TS sets:", tsSetIds.length);
const onlyX = xSetIds.filter((i) => !tsSetIds.includes(i));
const onlyT = tsSetIds.filter((i) => !xSetIds.includes(i));
if (onlyX.length) note(`option sets only in XLSX: ${JSON.stringify(onlyX)}`);
if (onlyT.length) note(`option sets only in TS: ${JSON.stringify(onlyT)}`);

let optIdDelta = 0,
  optPointsDelta = 0,
  optLabelDelta = 0,
  optNaDelta = 0,
  optExtraDelta = 0;
for (const gs of gos) {
  const ts = (
    optionSets as unknown as Record<string, { options: Array<Record<string, unknown>> }>
  )[gs.id];
  if (!ts) continue;
  const gIds = gs.options.map((o) => String(o.id)).join(",");
  const tIds = ts.options.map((o) => String(o.id)).join(",");
  if (gIds !== tIds) {
    optIdDelta++;
    note(`set ${gs.id} option ids/order XLSX=[${gIds}] TS=[${tIds}]`);
  }
  for (let i = 0; i < Math.min(gs.options.length, ts.options.length); i++) {
    const g = gs.options[i],
      t = ts.options[i];
    if (String(g.id) !== String(t.id)) continue;
    if (String(g.label) !== String(t.label)) {
      optLabelDelta++;
      note(`option ${gs.id}/${g.id} label XLSX='${g.label}' TS='${t.label}'`);
    }
    if ((g.points ?? null) !== (t.points ?? null)) {
      optPointsDelta++;
      note(`option ${gs.id}/${g.id} points XLSX=${g.points} TS=${t.points}`);
    }
    if (Boolean(g.isNa) !== Boolean(t.isNa)) {
      optNaDelta++;
      note(`option ${gs.id}/${g.id} isNa XLSX=${g.isNa} TS=${t.isNa}`);
    }
    if (Boolean(g.exclusive) !== Boolean(t.exclusive)) {
      optExtraDelta++;
      note(
        `option ${gs.id}/${g.id} exclusive XLSX=${g.exclusive} TS=${t.exclusive}`,
      );
    }
    if (g.storedValue !== undefined && t.points !== undefined) {
      note(
        `option ${gs.id}/${g.id} XLSX storedValue=${g.storedValue} but TS declares points=${t.points}`,
      );
    }
  }
}
console.log(
  "  id/order deltas:",
  optIdDelta,
  "| label:",
  optLabelDelta,
  "| points:",
  optPointsDelta,
  "| isNa:",
  optNaDelta,
  "| exclusive:",
  optExtraDelta,
);

// ---- domain model
console.log("\n== DOMAIN MODEL ==");
console.log("  XLSX tie order:", JSON.stringify(gen.scoring.domainTieOrder));
console.log("  TS  tie order :", JSON.stringify(DOMAIN_TIE_ORDER));
if (
  JSON.stringify(gen.scoring.domainTieOrder) !==
  JSON.stringify(DOMAIN_TIE_ORDER)
)
  note("domain tie order differs");
console.log(
  "  XLSX DOMAIN bands:",
  JSON.stringify(gen.scoring.classificationBands),
);
console.log("  TS model:", JSON.stringify(DOMAIN_MODEL));
for (const d of gen.scoring.domainDefinitions as Array<
  Record<string, unknown>
>) {
  const tsLabel = (DOMAIN_LABELS as Record<string, string>)[String(d.id)];
  if (tsLabel !== d.displayName)
    note(`domain label ${d.id}: XLSX='${d.displayName}' TS='${tsLabel}'`);
}

// ---- golden tests: does the engine reproduce the XLSX expectations?
console.log("\n== GOLDEN TESTS vs ENGINE ==");
let gtFail = 0;
for (const t of gen.goldenTests as Array<Record<string, unknown>>) {
  const actual = calculateScores(t.answers as Record<string, unknown>);
  const exp = t.expected as Record<string, unknown>;
  const expDomains = exp.domains as Record<string, number | null>;
  const diffs: string[] = [];
  for (const [d, v] of Object.entries(expDomains)) {
    if ((actual.domains as Record<string, number | null>)[d] !== v)
      diffs.push(
        `domains.${d}: expected ${v} got ${(actual.domains as Record<string, number | null>)[d]}`,
      );
  }
  if (actual.biologicalState !== exp.biological_state)
    diffs.push(
      `biological_state: expected ${exp.biological_state} got ${actual.biologicalState}`,
    );
  if (actual.opportunity !== exp.opportunity)
    diffs.push(
      `opportunity: expected ${exp.opportunity} got ${actual.opportunity}`,
    );
  if (actual.band !== (exp.biological_state === null ? null : actual.band)) {
    /* band not in sheet */
  }
  const expDrivers = exp.drivers as string[];
  if (expDrivers.length) {
    const norm = (value: string) => value.replace(/ co-primary$/, "");
    const actualDrivers = actual.drivers.map(norm);
    const expectedDrivers = expDrivers.map(norm);
    if (actual.drivers.length !== expDrivers.length)
      diffs.push(
        `drivers: expected ${JSON.stringify(expDrivers)} got ${JSON.stringify(actual.drivers)}`,
      );
    if (actualDrivers.join("+") !== expectedDrivers.join("+"))
      diffs.push(
        `driver order: expected ${JSON.stringify(expectedDrivers)} got ${JSON.stringify(actualDrivers)}`,
      );
  }
  if (diffs.length) {
    gtFail++;
    console.log(`  ${t.id} [${t.name}]`);
    diffs.forEach((d) => console.log(`      - ${d}`));
  }
}
console.log(
  `  golden tests failing against engine: ${gtFail}/${(gen.goldenTests as unknown[]).length}`,
);

// ---- TS golden tests vs XLSX
console.log("\n== TS GOLDEN TESTS vs XLSX ==");
console.log(
  "  TS golden count:",
  goldenTests.length,
  "XLSX:",
  (gen.goldenTests as unknown[]).length,
);
console.log("  TS ids:", JSON.stringify(goldenTests.map((t) => t.id)));

console.log(
  "\n================ FINDINGS (" + findings.length + ") ================",
);
findings.forEach((f) => console.log(" - " + f));

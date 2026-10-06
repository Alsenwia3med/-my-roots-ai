/**
 * ROOTS-AI(TM) M2 - Canonical structure verification (contractual requirement 10).
 *
 * Two layers of verification:
 *
 *  A. STRUCTURE - the implemented assessment reproduces the controlled
 *     C-01 v1.0.1 CORRECTED questionnaire shape (73 questions, 13 modules,
 *     71 required / 2 optional, 40 scoring-eligible).
 *
 *  B. PROVENANCE - when lib/canonical/generated/canonical-source.json exists
 *     (produced by scripts/ingest-canonical.ts straight from the controlled
 *     XLSX workbooks), every canonical field in lib/canonical/*.ts is asserted
 *     to reproduce the generated JSON with NO manual reinterpretation. Any
 *     divergence fails the run: the controlled source wins, never the
 *     hand-maintained TypeScript.
 *
 * Run: npm run test:canonical
 */

import { existsSync, readFileSync } from "node:fs";
import {
  allQuestions,
  assessmentModules,
  REQUIRED_MULTI_SELECT_QUESTIONS,
} from "@/lib/canonicalAssessment";
import { optionSets } from "@/lib/canonical/optionSets";
import { CANONICAL_VERSIONS, DOMAIN_MODEL, DOMAIN_TIE_ORDER } from "@/lib/canonical/source";

interface Check {
  id: string;
  description: string;
  expected: string;
  actual: string;
  pass: boolean;
}

const checks: Check[] = [];

function check(
  id: string,
  description: string,
  expected: unknown,
  actual: unknown,
) {
  const exp = JSON.stringify(expected);
  const act = JSON.stringify(actual);
  checks.push({
    id,
    description,
    expected: exp,
    actual: act,
    pass: exp === act,
  });
}

const scored = allQuestions.filter((q) => q.scoringEligible);
const required = allQuestions.filter((q) => q.required);
const optional = allQuestions.filter((q) => !q.required);

// ---------------------------------------------------------------- A. structure

check("C-01-A", "Total canonical questions", 73, allQuestions.length);
check("C-01-B", "Ordered modules", 13, assessmentModules.length);
check("C-01-C", "Required questions", 71, required.length);
check("C-01-D", "Optional questions", 2, optional.length);
check("C-01-E", "Scoring-eligible questions", 40, scored.length);
check(
  "C-01-F",
  "Module order is 1..13",
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  assessmentModules.map((m) => m.order),
);
check(
  "C-01-G",
  "Required multi-select set",
  ["Q13", "Q14", "Q52", "Q53", "Q54"],
  REQUIRED_MULTI_SELECT_QUESTIONS,
);
check(
  "C-01-H",
  "Question ids are Q1..Q73",
  Array.from({ length: 73 }, (_, i) => `Q${i + 1}`),
  allQuestions.map((q) => q.id),
);

const moduleRangesOk = assessmentModules.every((m) => {
  const nums = m.questions.map((q) => Number(q.id.slice(1)));
  return nums.length > 0 && nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
});
check("C-01-I", "Module questions are contiguous and ordered", true, moduleRangesOk);

const domainsOk = scored.every(
  (q) => q.domain && (DOMAIN_TIE_ORDER as readonly string[]).includes(q.domain),
);
check("C-01-J", "Scoring questions map to a canonical domain", true, domainsOk);

check(
  "C-02-A",
  "Questionnaire version",
  "C-01 v1.0.1 CORRECTED",
  CANONICAL_VERSIONS.questionnaire,
);
check(
  "C-02-B",
  "Scoring version",
  "C-02 v1.0.1 CORRECTED",
  CANONICAL_VERSIONS.scoring,
);

// ------------------------------------------------- B. provenance vs generated JSON

const GENERATED_PATH = "lib/canonical/generated/canonical-source.json";

interface GeneratedOption {
  id: string;
  label: string;
  points?: number;
  storedValue?: number;
  isNa?: boolean;
}

interface GeneratedSource {
  canonicalVersions: { questionnaire: string; scoring: string };
  counts: Record<string, number>;
  modules: Array<Record<string, unknown>>;
  questions: Array<Record<string, unknown>>;
  optionSets: Array<{ id: string; scoringScope: string; options: GeneratedOption[] }>;
  scoring: {
    domainTieOrder: string[];
    classificationBands: Array<{ min: number; max: number; label: string }>;
    formulas: Array<{ ruleId: string; nullOrBoundaryRule: string }>;
    driverRules: Array<{ ruleId: string; rule: string }>;
    protectiveFactors: Array<{ factorId: string; rule: string }>;
  };
  goldenTests: unknown[];
  integrity: {
    scoringFlagAgreesAcrossSheets: boolean;
    c01Qa: Array<{ check: string; expected: unknown; result: unknown }>;
    c02Qa: Array<{ check: string; expected: unknown; result: unknown }>;
  };
}

/**
 * Equivalence rules applied when comparing the controlled sheets to the
 * hand-maintained TypeScript. Each rule encodes a property of the controlled
 * source rather than a tolerance:
 *
 *  P1  C-01 `stored_value_or_points` on a NON-scored question is a stored
 *      response value, not a burden. lib/canonical/optionSets.ts may declare it
 *      as `points` as long as the question is not scoring-eligible, because the
 *      engine only ever reads `points` for scoring-eligible questions.
 *  P2  `exclusive` for a non-N/A option is a C-01 questionnaire rule
 *      (VAL-004/VAL-005), not a C-01 cell, so the ingestion does not emit it
 *      and the verifier does not compare it.
 *  P3  A question's option ids/labels/order/points come straight from the
 *      sheets and MUST match exactly.
 *  P4  `scoringEligible` is defined by C-02 Question_Mapping membership and is
 *      asserted (in the generator) to agree with the C-01 scoring_eligible flag.
 */
function compareOptionSets(generated: GeneratedSource): {
  mismatches: string[];
  compared: number;
} {
  const mismatches: string[] = [];
  let compared = 0;

  const tsIds = Object.keys(optionSets);
  const genIds = generated.optionSets.map((s) => s.id);
  if (JSON.stringify(tsIds) !== JSON.stringify(genIds)) {
    mismatches.push(
      `option set ids differ: sheet=${JSON.stringify(genIds)} ts=${JSON.stringify(tsIds)}`,
    );
  }

  for (const gs of generated.optionSets) {
    const ts = optionSets[gs.id];
    if (!ts) {
      mismatches.push(`option set ${gs.id} present in sheets but missing in TypeScript`);
      continue;
    }
    const scoreable = gs.scoringScope === "scoring";

    if (gs.options.length !== ts.options.length) {
      mismatches.push(
        `set ${gs.id}: option count sheet=${gs.options.length} ts=${ts.options.length}`,
      );
      continue;
    }

    for (let i = 0; i < gs.options.length; i++) {
      const g = gs.options[i];
      const t = ts.options[i];
      compared += 1;

      if (g.id !== t.id) {
        mismatches.push(`set ${gs.id} index ${i}: option id sheet=${g.id} ts=${t.id}`);
        continue;
      }
      if (g.label !== t.label) {
        mismatches.push(`option ${gs.id}/${g.id}: label sheet='${g.label}' ts='${t.label}'`);
      }

      // P3 / P1: burden points must match wherever the set drives scoring; on a
      // non-scored set the C-01 stored value must match whatever the TypeScript
      // declares, because that value is never consumed as burden.
      const gp = scoreable ? (g.points ?? null) : (g.points ?? g.storedValue ?? null);
      const tp = t.points ?? null;
      if (gp !== tp) {
        mismatches.push(
          `option ${gs.id}/${g.id}: value sheet=${gp} ts=${tp}` +
            (scoreable ? " (scored set)" : " (non-scored set)"),
        );
      }

      // N/A flag is a C-01 cell and must match exactly.
      if (Boolean(g.isNa) !== Boolean(t.isNa)) {
        mismatches.push(`option ${gs.id}/${g.id}: isNa sheet=${!!g.isNa} ts=${!!t.isNa}`);
      }
    }
  }

  return { mismatches, compared };
}

function compareQuestions(generated: GeneratedSource): {
  mismatches: string[];
  compared: number;
} {
  const mismatches: string[] = [];
  let compared = 0;
  const byId = new Map(allQuestions.map((q) => [q.id, q]));
  const moduleOf = new Map<string, string>();
  for (const m of assessmentModules) for (const q of m.questions) moduleOf.set(q.id, m.id);

  if (generated.questions.length !== allQuestions.length) {
    mismatches.push(
      `question count sheet=${generated.questions.length} ts=${allQuestions.length}`,
    );
  }

  for (const g of generated.questions) {
    const id = String(g.id);
    const t = byId.get(id);
    if (!t) {
      mismatches.push(`question ${id} present in sheets but missing in TypeScript`);
      continue;
    }
    compared += 1;

    const pairs: Array<[string, unknown, unknown]> = [
      ["text", g.text, t.text],
      ["type", g.type, t.type],
      ["required", g.required, t.required],
      ["allowNa", g.allowNa, t.allowNa],
      ["scoringEligible", g.scoringEligible, t.scoringEligible],
      ["optionSetId", g.optionSetId ?? undefined, t.optionSetId ?? undefined],
      ["min", g.min ?? undefined, t.min ?? undefined],
      ["max", g.max ?? undefined, t.max ?? undefined],
      ["moduleId", g.moduleId, moduleOf.get(id)],
    ];
    if (g.scoringEligible === true) {
      pairs.push(["domain", g.domain, t.domain]);
      pairs.push(["reverseScored", g.reverseScored ?? false, t.reverseScored ?? false]);
    }
    for (const [field, sheetValue, tsValue] of pairs) {
      if (JSON.stringify(sheetValue) !== JSON.stringify(tsValue)) {
        mismatches.push(
          `Q ${id} ${field}: sheet=${JSON.stringify(sheetValue)} ts=${JSON.stringify(tsValue)}`,
        );
      }
    }
  }

  return { mismatches, compared };
}

function compareModules(generated: GeneratedSource): {
  mismatches: string[];
  compared: number;
} {
  const mismatches: string[] = [];
  let compared = 0;
  if (generated.modules.length !== assessmentModules.length) {
    mismatches.push(
      `module count sheet=${generated.modules.length} ts=${assessmentModules.length}`,
    );
  }
  for (let i = 0; i < Math.min(generated.modules.length, assessmentModules.length); i++) {
    const g = generated.modules[i];
    const t = assessmentModules[i];
    compared += 1;
    const pairs: Array<[string, unknown, unknown]> = [
      ["id", g.id, t.id],
      ["order", g.order, t.order],
      ["title", g.title, t.title],
      ["purpose", g.purpose, t.purpose],
      ["firstQuestionOrder", g.firstQuestionOrder, t.firstQuestionOrder],
      ["lastQuestionOrder", g.lastQuestionOrder, t.lastQuestionOrder],
    ];
    for (const [field, sheetValue, tsValue] of pairs) {
      if (JSON.stringify(sheetValue) !== JSON.stringify(tsValue)) {
        mismatches.push(
          `module ${String(g.id)} ${field}: sheet=${JSON.stringify(sheetValue)} ts=${JSON.stringify(tsValue)}`,
        );
      }
    }
  }
  return { mismatches, compared };
}

const generated: GeneratedSource | null = existsSync(GENERATED_PATH)
  ? (JSON.parse(readFileSync(GENERATED_PATH, "utf8")) as GeneratedSource)
  : null;

if (!generated) {
  checks.push({
    id: "GEN-00",
    description: `Generated canonical JSON present (${GENERATED_PATH})`,
    expected: "present",
    actual: "absent",
    pass: false,
  });
} else {
  check(
    "GEN-01",
    "Declared versions reproduced from sheets",
    CANONICAL_VERSIONS,
    generated.canonicalVersions,
  );
  check(
    "GEN-02",
    "Scoring flag agrees across C-01 and C-02 sheets",
    true,
    generated.integrity.scoringFlagAgreesAcrossSheets,
  );

  check("GEN-03", "Sheet question count = implemented", allQuestions.length, generated.counts.questions);
  check("GEN-04", "Sheet module count = implemented", assessmentModules.length, generated.counts.modules);
  check("GEN-05", "Sheet required count = implemented", required.length, generated.counts.required);
  check("GEN-06", "Sheet optional count = implemented", optional.length, generated.counts.optional);
  check("GEN-07", "Sheet scoring count = implemented", scored.length, generated.counts.scoringEligible);
  check("GEN-08", "Sheet golden test count", 30, generated.goldenTests.length);

  // Every controlled QA check must PASS in both workbooks.
  const qaRows = [...generated.integrity.c01Qa, ...generated.integrity.c02Qa];
  const qaAllPass =
    qaRows.length > 0 && qaRows.every((r) => String(r.result).toUpperCase() === "PASS");
  check("GEN-09", "All controlled workbook QA_Checks PASS", true, qaAllPass);

  // C-02 declares the tie order and the 5-of-7 / 50% / co-primary-gap rules.
  check(
    "GEN-10",
    "Sheet domain tie order = implemented",
    DOMAIN_TIE_ORDER,
    generated.scoring.domainTieOrder,
  );
  const sc002 = generated.scoring.formulas.find((f) => f.ruleId === "SC-002");
  check(
    "GEN-11",
    "SC-002: Biological State null below 5 domains",
    `Null if fewer than ${DOMAIN_MODEL.biologicalStateRequiredDomains} domains available`,
    sc002?.nullOrBoundaryRule,
  );
  const sc001 = generated.scoring.formulas.find((f) => f.ruleId === "SC-001");
  check(
    "GEN-12",
    "SC-001: 50% coverage floor",
    `N/A/missing excluded; null if answered/eligible < ${DOMAIN_MODEL.coverageThreshold.toFixed(2)}`,
    sc001?.nullOrBoundaryRule,
  );
  const drv003 = generated.scoring.driverRules.find((r) => r.ruleId === "DRV-003");
  check(
    "GEN-13",
    "DRV-003: co-primary within gap",
    `If top two eligible scores differ by ≤${DOMAIN_MODEL.coPrimaryGap}, report them once as one co-primary pair`,
    drv003?.rule,
  );

  // Provenance: the TypeScript must reproduce the sheets.
  const optResult = compareOptionSets(generated);
  check(
    "PROV-01",
    "Option sets reproduced from sheets (ids, order, labels, points, N/A)",
    [],
    optResult.mismatches,
  );

  const qResult = compareQuestions(generated);
  check(
    "PROV-02",
    "Questions reproduced from sheets (text, type, required, N/A, scoring, domain, reverse)",
    [],
    qResult.mismatches,
  );

  const mResult = compareModules(generated);
  check(
    "PROV-03",
    "Modules reproduced from sheets (id, order, title, range)",
    [],
    mResult.mismatches,
  );

  // Cross-check: every C-02 scored item resolves to a C-01 option set.
  const scoredWithSets = generated.questions.filter((q) => q.scoringEligible === true);
  const usedSetsOk = scoredWithSets.every((q) => {
    const setId = q.optionSetId as string | undefined;
    return setId !== undefined && setId in optionSets;
  });
  check("PROV-04", "Every C-02 scored item resolves to a C-01 option set", true, usedSetsOk);

  checks.push({
    id: "PROV-05",
    description: "Fields compared against the controlled sheets",
    expected: ">0",
    actual: `${optResult.compared} options, ${qResult.compared} questions, ${mResult.compared} modules`,
    pass: optResult.compared > 0 && qResult.compared === allQuestions.length,
  });
}

// ------------------------------------------------------------------- report

let pass = 0;
let fail = 0;
console.log("=== Canonical Structure + Provenance Verification ===\n");
console.log("Check    | Expected | Actual | Result | Description");
console.log("-".repeat(100));
for (const c of checks) {
  if (c.pass) pass++;
  else fail++;
  console.log(
    `${c.id.padEnd(8)} | ${c.expected.padEnd(28).slice(0, 28)} | ${c.actual.padEnd(20).slice(0, 20)} | ${c.pass ? "PASS" : "FAIL"} | ${c.description}`,
  );
  if (!c.pass) {
    try {
      const detail = JSON.parse(c.actual) as unknown;
      if (Array.isArray(detail)) detail.slice(0, 20).forEach((d) => console.log(`         - ${String(d)}`));
    } catch {
      /* actual is not a JSON array of findings */
    }
  }
}
console.log("-".repeat(100));
console.log(`Passed: ${pass}  Failed: ${fail}`);
if (!generated) {
  console.log(
    "\nNOTE: run scripts/ingest-canonical.ts with the controlled C-01/C-02 XLSX to " +
      "generate the provenance JSON, then re-run this verification.",
  );
}
if (fail > 0) process.exitCode = 1;

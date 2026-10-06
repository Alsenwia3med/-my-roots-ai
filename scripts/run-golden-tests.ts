import { calculateScoresFromNormalizedInput } from "@/lib/scoring";
import { goldenTests, compare, toGoldenOutput } from "@/lib/canonical/goldenTests";
import { CANONICAL_VERSIONS } from "@/lib/canonical/source";

interface Row {
  id: string;
  name: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  errors: string[];
}

function summarize(value: unknown): string {
  return JSON.stringify(value);
}

function run() {
  console.log("ROOTS-AI(TM) M2 - C-02 Canonical Golden Tests");
  console.log(`Questionnaire: ${CANONICAL_VERSIONS.questionnaire}`);
  console.log(`Scoring:       ${CANONICAL_VERSIONS.scoring}`);
  console.log(`Total tests:   ${goldenTests.length}\n`);

  const rows: Row[] = [];
  let passed = 0;
  let failed = 0;

  for (const test of goldenTests) {
    const actual = calculateScoresFromNormalizedInput(test.normalizedInput, test.context);
    const errors = compare(actual, test.expected);
    const ok = errors.length === 0;
    if (ok) passed++;
    else failed++;

    const actualSummary = toGoldenOutput(actual);

    rows.push({
      id: test.id,
      name: test.name,
      input: summarize(test.answers),
      expected: summarize(test.expected),
      actual: summarize(actualSummary),
      passed: ok,
      errors,
    });
  }

  // Evidence table required by M2 section 8.
  console.log("=== Golden Test Evidence (Test ID -> Input -> Expected -> Actual -> PASS/FAIL) ===\n");
  for (const row of rows) {
    console.log(`[${row.id}] ${row.name}`);
    console.log(`  INPUT    : ${row.input}`);
    console.log(`  EXPECTED : ${row.expected}`);
    console.log(`  ACTUAL   : ${row.actual}`);
    console.log(`  RESULT   : ${row.passed ? "PASS" : "FAIL"}`);
    if (!row.passed) row.errors.forEach((e) => console.log(`    - ${e}`));
    console.log("");
  }

  console.log("=== Summary ===");
  console.log(`Total : ${rows.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  const met = failed === 0 && passed >= 30;
  console.log(`Acceptance (all tests PASS, >= 30 canonical): ${met ? "MET" : "NOT MET"}`);

  if (!met) process.exitCode = 1;
}

run();
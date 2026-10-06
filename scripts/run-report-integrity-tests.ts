/**
 * M3 Canonical Report Object - integrity test suite.
 *
 * Proves M3 sections 3, 4, 5 and 17:
 *   - canonical immutable report object integrity
 *   - deterministic hash stability and tamper detection
 *   - 19/19 governed section architecture
 *   - drivers reflect the exact C-02 output (incl. zero-length and co-primary)
 *   - missing data stays explicit (no imputation, no invented filler)
 *   - reduced / Not Available states
 *   - text and numeric equivalents for visualised data (a11y)
 *   - web/PDF same-canonical-source parity
 *
 * Run: npm run test:report
 */
import { calculateScores, calculateScoresFromNormalizedInput } from "@/lib/scoring";
import {
  REPORT_SECTION_COUNT,
  buildCanonicalReport,
  computeContentHash,
  verifyReportIntegrity,
  type CanonicalReport,
} from "@/lib/canonical/report";
import { assertReportIntegrity, generateReport } from "@/lib/report/pipeline";
import { goldenTests } from "@/lib/canonical/goldenTests";
import { DOMAIN_TIE_ORDER } from "@/lib/canonical/source";

interface Row {
  id: string;
  name: string;
  ok: boolean;
  detail: string;
}

const rows: Row[] = [];
let passed = 0;
let failed = 0;

function rec(id: string, name: string, ok: boolean, detail: string) {
  if (ok) passed++;
  else failed++;
  rows.push({ id, name, ok, detail });
  console.log(`${id.padEnd(9)} | ${ok ? "PASS" : "FAIL"} | ${name}`);
  console.log(`          | ${detail}`);
}

const uniform0 = goldenTests[0].answers;
const scoring = calculateScores(uniform0);

// RP-01: 19/19 governed sections
{
  const report = buildCanonicalReport({ assessmentId: "rp-01", scoring });
  rec(
    "RP-01",
    "Canonical report contains 19/19 governed sections",
    report.sections.length === REPORT_SECTION_COUNT &&
      REPORT_SECTION_COUNT === 19,
    `sections=${report.sections.length}; contracted count=${REPORT_SECTION_COUNT}; indexes contiguous=${report.sections.every((s, i) => s.index === i + 1)}`,
  );
}

// RP-02: hash determinism (same input -> same hash, repeated)
{
  const a = computeContentHash("rp-02", scoring);
  const b = computeContentHash("rp-02", calculateScores(uniform0));
  const c = computeContentHash("rp-02", calculateScores(uniform0));
  rec(
    "RP-02",
    "Content hash is deterministic across recomputation",
    a === b && b === c,
    `hash=${a.slice(0, 24)}...; identical across 3 independent computations=${a === b && b === c}`,
  );
}

// RP-03: hash is independent of construction time (no wall-clock in hash)
{
  const early = buildCanonicalReport({
    assessmentId: "rp-03",
    scoring,
    now: new Date("2020-01-01T00:00:00Z"),
  });
  const late = buildCanonicalReport({
    assessmentId: "rp-03",
    scoring,
    now: new Date("2030-06-15T12:34:56Z"),
  });
  rec(
    "RP-03",
    "Content hash is independent of construction timestamp",
    early.contentHash === late.contentHash,
    `2020 hash=${early.contentHash.slice(0, 16)}...; 2030 hash=${late.contentHash.slice(0, 16)}...; identical=${early.contentHash === late.contentHash}`,
  );
}

// RP-04: hash changes when an authoritative value is altered (tamper detection)
{
  const report = buildCanonicalReport({ assessmentId: "rp-04", scoring });
  const tampered: CanonicalReport = {
    ...report,
    scoring: { ...report.scoring, biologicalState: 99 },
  };
  rec(
    "RP-04",
    "Tampering with an authoritative value breaks integrity",
    verifyReportIntegrity(report) === true &&
      verifyReportIntegrity(tampered) === false,
    `pristine integrity=${verifyReportIntegrity(report)}; tampered integrity=${verifyReportIntegrity(tampered)} (must be false)`,
  );
}

// RP-05: tampering a domain score in the stored object is detected
{
  const report = buildCanonicalReport({ assessmentId: "rp-05", scoring });
  const tampered: CanonicalReport = {
    ...report,
    scoring: {
      ...report.scoring,
      domains: { ...report.scoring.domains, MR: 42 },
    },
  };
  rec(
    "RP-05",
    "Tampering with a domain score breaks integrity",
    verifyReportIntegrity(tampered) === false,
    `integrity after domain tamper=${verifyReportIntegrity(tampered)} (must be false)`,
  );
}

// RP-06: assertReportIntegrity accepts a valid report and rejects a bad one
{
  const good = buildCanonicalReport({ assessmentId: "rp-06", scoring });
  let goodOk = true;
  try {
    assertReportIntegrity(good);
  } catch {
    goodOk = false;
  }
  const bad: CanonicalReport = { ...good, contentHash: "deadbeef" };
  let badRejected = false;
  try {
    assertReportIntegrity(bad);
  } catch {
    badRejected = true;
  }
  rec(
    "RP-06",
    "Integrity guard accepts valid reports and rejects invalid ones",
    goodOk && badRejected,
    `valid accepted=${goodOk}; forged hash rejected=${badRejected}`,
  );
}

// RP-07: drivers reflect the exact C-02 output
{
  const report = buildCanonicalReport({ assessmentId: "rp-07", scoring });
  const identical =
    JSON.stringify(report.scoring.drivers) === JSON.stringify(scoring.drivers);
  rec(
    "RP-07",
    "Report drivers are the exact deterministic C-02 output",
    identical,
    `report drivers=${JSON.stringify(report.scoring.drivers)}; engine drivers=${JSON.stringify(scoring.drivers)}`,
  );
}

// RP-08: co-primary is preserved as one governed entry
{
  const fixture = goldenTests.find((test) => test.id === "GT-003")!;
  const coPrimaryScoring = calculateScoresFromNormalizedInput(
    fixture.normalizedInput,
    fixture.context,
  );
  const report = buildCanonicalReport({ assessmentId: "rp-08", scoring: coPrimaryScoring });
  const pair = report.scoring.drivers.filter((d) => d.includes("+"));
  const coPrimaryFlag = report.scoring.coPrimary;
  rec(
    "RP-08",
    "Co-primary pair is preserved as a single governed entry",
    coPrimaryFlag && pair.length >= 1,
    `coPrimary=${coPrimaryFlag}; combined entries=${JSON.stringify(pair)}; drivers=${JSON.stringify(report.scoring.drivers)}`,
  );
}

// RP-09: zero-length driver array is preserved when no domain is eligible
{
  // Only contextual answers at burden 0 -> every domain null -> no eligible drivers.
  const empty = calculateScores({});
  const report = buildCanonicalReport({
    assessmentId: "rp-09",
    scoring: empty,
  });
  rec(
    "RP-09",
    "Zero-length driver array is preserved (no invented driver)",
    Array.isArray(report.scoring.drivers) &&
      report.scoring.drivers.length === 0,
    `drivers=${JSON.stringify(report.scoring.drivers)} (length ${report.scoring.drivers.length}); biologicalState=${report.scoring.biologicalState}`,
  );
}

// RP-10: missing data stays explicit - no imputation or filler
{
  const empty = calculateScores({});
  const report = buildCanonicalReport({
    assessmentId: "rp-10",
    scoring: empty,
  });
  const allNull = DOMAIN_TIE_ORDER.every(
    (d) => report.scoring.domains[d] === null,
  );
  const equivalentsExplicit = Object.values(report.numericEquivalents).every(
    (t) => !/\b\d+ of 100\b/.test(t) || /not/i.test(t),
  );
  rec(
    "RP-10",
    "Missing data stays explicit: no imputation or invented filler",
    allNull && equivalentsExplicit,
    `all domains null=${allNull}; no fabricated numeric equivalents=${equivalentsExplicit}; sample="${report.numericEquivalents["domain.MR"]}"`,
  );
}

// RP-11: corrected C-03 content is present; reduced states are explicit
{
  const report = buildCanonicalReport({ assessmentId: "rp-11", scoring, answers: uniform0 });
  const titles = report.sections.map((s) => s.title);
  const expectedTitles = [
    "Cover Page", "Executive Summary", "ROOTS Biological State™", "ROOTS Opportunity Score™",
    "ROOTS Confidence™", "Key Drivers", "Seven-Domain Score Breakdown", "Biological Triad™",
    "Future Projection", "90-Day Roadmap", "Nutrition Priorities", "Action Priorities",
    "What Is Going Well", "Specific Concerns", "Suggested Laboratory Discussion", "Participant Answers",
    "Biological Card", "Final Word", "Medical and AI Disclaimer",
  ];
  const allPresent = report.sections.every((s) => typeof s.narrative === "string" && s.narrative.length > 0);
  const allExplicit = report.limitations.every((l) => typeof l.message === "string" && l.message.length > 0);
  rec(
    "RP-11",
    "C-03 corrected 19-section content and explicit limitations are present",
    JSON.stringify(titles) === JSON.stringify(expectedTitles) && allPresent && allExplicit,
    `titles=${titles.length}; content-backed=${allPresent}; limitations=${report.limitations.length}; null-state copy remains explicit=${report.sections.filter((s) => s.reduced).every((s) => Boolean(s.reducedReason))}`,
  );
}

// RP-12: text/numeric equivalents exist for every visualised value (a11y)
{
  const report = buildCanonicalReport({ assessmentId: "rp-12", scoring });
  const required = [
    "biologicalState",
    "opportunity",
    "recoveryPotential",
    "drivers",
    "domainCount",
    ...DOMAIN_TIE_ORDER.map((d) => `domain.${d}`),
  ];
  const missing = required.filter((k) => !report.numericEquivalents[k]);
  rec(
    "RP-12",
    "Every visualised value has a text/numeric equivalent",
    missing.length === 0,
    missing.length === 0
      ? `${required.length} required equivalents present (state, opportunity, recovery, drivers, count, 7 domains)`
      : `MISSING: ${missing.join(", ")}`,
  );
}

// RP-13: null-domain state is communicated in text, not by colour
{
  const empty = calculateScores({});
  const report = buildCanonicalReport({
    assessmentId: "rp-13",
    scoring: empty,
  });
  const text = report.numericEquivalents["domain.MR"];
  rec(
    "RP-13",
    "Null domain state is stated in text (colour alone never communicates)",
    typeof text === "string" && /not enough information/i.test(text),
    `domain.MR text equivalent="${text}"`,
  );
}

// RP-14: version provenance is retained on the report
{
  const report = buildCanonicalReport({ assessmentId: "rp-14", scoring });
  const p = report.provenance;
  const ok =
    !!p.questionnaireVersion &&
    !!p.scoringVersion &&
    !!p.reportVersion &&
    !!p.constructedAt;
  rec(
    "RP-14",
    "Report identity, timestamps and versions are retained",
    ok,
    `questionnaire="${p.questionnaireVersion}"; scoring="${p.scoringVersion}"; report="${p.reportVersion}"; constructedAt=${p.constructedAt}`,
  );
}

async function main() {
  // RP-15: web and PDF render from the SAME stored canonical record
  {
    const generated = await generateReport("rp-15", uniform0);
    const hash = generated.report.contentHash;
    // The PDF route reads the stored record and asserts integrity; it has no
    // scoring import path and therefore cannot recompute independently.
    const { readFileSync } = await import("node:fs");
    const pdfSource = readFileSync(
      "app/api/assessment/sessions/[sessionId]/report/pdf/route.ts",
      "utf8",
    );
    const importsScoring = /from\s+["'][^"']*lib\/scoring/.test(pdfSource);
    const importsPipeline = /lib\/report\/pipeline/.test(pdfSource);
    const readsStored = /getCanonicalReportByAssessment/.test(pdfSource);
    rec(
      "RP-15",
      "PDF route shares the canonical source and cannot recalculate",
      !importsScoring && importsPipeline && readsStored,
      `reads stored canonical record=${readsStored}; asserts integrity=${importsPipeline}; imports scoring engine=${importsScoring} (must be false); report hash=${hash.slice(0, 16)}...`,
    );
  }

  // RP-16: web report page does not import the scoring engine
  {
    const { readFileSync } = await import("node:fs");
    const pageSource = readFileSync("app/report/[reportId]/page.tsx", "utf8");
    const importsScoring = /from\s+["'][^"']*lib\/scoring/.test(pageSource);
    const usesSessionStorage = /sessionStorage/.test(pageSource);
    const fetchesApi =
      /report`/.test(pageSource) || /\/report/.test(pageSource);
    rec(
      "RP-16",
      "Web report reads the stored record; no client-side recalculation",
      !importsScoring && !usesSessionStorage && fetchesApi,
      `imports scoring engine=${importsScoring} (must be false); uses sessionStorage=${usesSessionStorage} (must be false); reads report API=${fetchesApi}`,
    );
  }

  // RP-17: same answers produce identical stored records (reproducibility)
  {
    const a = await generateReport("rp-17", uniform0, {
      now: new Date("2025-01-01T00:00:00Z"),
    });
    const b = await generateReport("rp-17", uniform0, {
      now: new Date("2025-01-01T00:00:00Z"),
    });
    rec(
      "RP-17",
      "Identical answers produce an identical canonical record",
      JSON.stringify(a.report) === JSON.stringify(b.report),
      `contentHash a=${a.report.contentHash.slice(0, 16)}...; b=${b.report.contentHash.slice(0, 16)}...; full record identical=${JSON.stringify(a.report) === JSON.stringify(b.report)}`,
    );
  }

  // RP-18: different answers produce a different hash
  {
    const other = calculateScores(goldenTests[4].answers);
    const a = computeContentHash("rp-18", scoring);
    const b = computeContentHash("rp-18", other);
    rec(
      "RP-18",
      "Different deterministic results produce different hashes",
      a !== b,
      `burden-0 hash=${a.slice(0, 16)}...; burden-4 hash=${b.slice(0, 16)}...; distinct=${a !== b}`,
    );
  }

  // RP-19: report carries AI provenance slot even when narrative is disabled
  {
    const generated = await generateReport("rp-19", uniform0);
    const ai = generated.report.provenance.ai;
    rec(
      "RP-19",
      "AI provenance is recorded as governed fallback when unavailable",
      !!ai && ai.usedFallback === true && !!ai.fallbackVersion,
      ai
        ? `usedFallback=${ai.usedFallback}; fallbackVersion="${ai.fallbackVersion}"; reason="${ai.fallbackReason}"; provider="${ai.provider}"`
        : "no AI provenance recorded (BAD)",
    );
  }

  // RP-20: pipeline refuses to serve a report with a forged hash
  {
    const generated = await generateReport("rp-20", uniform0);
    const forged: CanonicalReport = {
      ...generated.report,
      contentHash: "0".repeat(64),
    };
    let rejected = false;
    try {
      assertReportIntegrity(forged);
    } catch {
      rejected = true;
    }
    rec(
      "RP-20",
      "Pipeline integrity guard blocks a forged stored report",
      rejected,
      `forged-hash report rejected before serving=${rejected}`,
    );
  }

  console.log("\n=== Summary ===");
  console.log(`Total : ${rows.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(
    `Acceptance (all report-integrity tests PASS): ${failed === 0 ? "MET" : "NOT MET"}`,
  );
  if (failed > 0) process.exitCode = 1;
}

main();

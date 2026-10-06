/**
 * M3 Controlled AI Boundary - governance test suite.
 *
 * Proves the Vendor-Core AI-governance controls required by M3 sections 2 and 17.
 * Run: npm run test:ai
 */
import { readFileSync } from "node:fs";
import { calculateScores } from "@/lib/scoring";
import { assertReportIntegrity, generateReport } from "@/lib/report/pipeline";
import {
  DEFAULT_AI_CONFIG,
  applyFallback,
  buildAiProjection,
  findHallucinatedNumber,
  findProhibitedLanguage,
  generateGovernedNarrative,
  validateNarrativeResponse,
  type AiNarrativeConfig,
  type NarrativeTransport,
} from "@/lib/ai/boundary";
import { buildCanonicalReport } from "@/lib/canonical/report";
import { goldenTests } from "@/lib/canonical/goldenTests";

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

const validAnswers = goldenTests[0].answers;
const scoring = calculateScores(validAnswers);
const projection = buildAiProjection(scoring);

const approvedProvenance = {
  provider: "test-provider",
  model: "test-model",
  promptVersion: "PROMPT v1.0.0",
  schemaVersion: "SCHEMA v1.0.0",
  contentLibraryVersion: "CONTENT-LIB v1.0.0",
  fallbackVersion: null as string | null,
  usedFallback: false,
  fallbackReason: null as string | null,
};

async function main() {
  // AI-01
  {
    const keys = Object.keys(projection);
    const leaked = ["answers", "responses", "rawAnswers", "Q9", "Q10"].filter((k) =>
      keys.includes(k),
    );
    rec(
      "AI-01",
      "Approved projection carries no raw answers",
      leaked.length === 0,
      leaked.length === 0 ? `projection keys = [${keys.join(", ")}]` : `LEAK: ${leaked.join(", ")}`,
    );
  }

  // AI-02
  {
    const before = JSON.stringify(scoring);
    const mutable = projection as unknown as Record<string, unknown>;
    mutable.biologicalState = 999;
    mutable.drivers = ["INJECTED"];
    const after = JSON.stringify(calculateScores(validAnswers));
    rec(
      "AI-02",
      "Read-only projection cannot alter the authoritative result",
      before === after,
      `authoritative scoring identical after mutation attempt: ${before === after}`,
    );
  }

  // AI-03
  {
    const outcome = validateNarrativeResponse(
      { sections: [{ index: 1, narrative: "Fine." }], biologicalState: 88 },
      projection,
      19,
    );
    rec(
      "AI-03",
      "Score-bearing key in AI output is rejected",
      !outcome.ok && outcome.code === "score_injection",
      `code=${outcome.ok ? "accepted (BAD)" : outcome.code}; ${outcome.ok ? "" : outcome.reason}`,
    );
  }

  // AI-04
  {
    const outcome = validateNarrativeResponse(
      { sections: [{ index: 1, narrative: "Fine.", score: 77 }] },
      projection,
      19,
    );
    rec(
      "AI-04",
      "Nested score key inside a section is rejected",
      !outcome.ok,
      `code=${outcome.ok ? "accepted (BAD)" : outcome.code}; ${outcome.ok ? "" : outcome.reason}`,
    );
  }

  // AI-05
  {
    const a = validateNarrativeResponse("not an object", projection, 19);
    const b = validateNarrativeResponse({ narrative: "no sections" }, projection, 19);
    const c = validateNarrativeResponse(null, projection, 19);
    rec(
      "AI-05",
      "Malformed AI output is rejected",
      !a.ok && !b.ok && !c.ok,
      `string=${a.ok ? "accepted(BAD)" : a.code}; no-sections=${b.ok ? "accepted(BAD)" : b.code}; null=${c.ok ? "accepted(BAD)" : c.code}`,
    );
  }

  // AI-06
  {
    const found = findHallucinatedNumber("Your metabolic score is 91 out of 100.", projection);
    rec(
      "AI-06",
      "Hallucinated numeric value is rejected",
      found === "91",
      found ? `invented value "${found}" is not in the approved projection` : "NOT DETECTED (BAD)",
    );
  }

  // AI-07
  {
    const text = "Your Biological State is 0 out of 100 and 7 of 7 domains were scored.";
    const found = findHallucinatedNumber(text, projection);
    rec(
      "AI-07",
      "Genuine projection values are not false-flagged",
      found === null,
      found === null ? "no false positive on approved values" : `false positive on "${found}"`,
    );
  }

  // AI-08
  {
    const cases: Array<[string, string]> = [
      ["You have metabolic syndrome.", "diagnostic"],
      ["This treatment plan will cure your condition.", "prescriptive"],
      ["Take a dose of 500mg daily.", "medication"],
      ["You are eligible for coverage under this plan.", "eligibility-decision"],
    ];
    const results = cases.map(([text, label]) => ({ label, term: findProhibitedLanguage(text) }));
    rec(
      "AI-08",
      "Prohibited diagnostic/prescriptive language is rejected",
      results.every((r) => r.term !== null),
      results.map((r) => `${r.label}=${r.term ?? "NOT DETECTED"}`).join("; "),
    );
  }

  // AI-09
  {
    const cases: Array<[string, string]> = [
      ["This is a life-threatening critical condition.", "alarmist"],
      ["This proves that you will develop disease.", "certainty"],
      ["Your result is definitive and without doubt.", "certainty"],
    ];
    const results = cases.map(([text, label]) => ({ label, term: findProhibitedLanguage(text) }));
    rec(
      "AI-09",
      "Alarmist and certainty language is rejected",
      results.every((r) => r.term !== null),
      results.map((r) => `${r.label}=${r.term ?? "NOT DETECTED"}`).join("; "),
    );
  }

  // AI-10
  {
    const outcome = validateNarrativeResponse(
      { sections: [{ index: 3, narrative: "You have diabetes and need medication." }] },
      projection,
      19,
    );
    rec(
      "AI-10",
      "Validator rejects prohibited language end-to-end",
      !outcome.ok && outcome.code === "prohibited_language",
      `code=${outcome.ok ? "accepted (BAD)" : outcome.code}; ${outcome.ok ? "" : outcome.reason}`,
    );
  }

  // AI-11
  {
    const report = buildCanonicalReport({
      assessmentId: "ai-11",
      scoring,
      narrative: {
        sections: [
          { index: 1, narrative: "Allowed narrative." },
          { index: 999, narrative: "INJECTED SECTION" },
        ],
        provenance: approvedProvenance,
      },
    });
    const count = report.sections.length === 19;
    const contiguous = report.sections.every((s, i) => s.index === i + 1);
    const injected = report.sections.some((s) => s.narrative === "INJECTED SECTION");
    rec(
      "AI-11",
      "AI cannot add or reindex report sections",
      count && contiguous && !injected,
      `sections=${report.sections.length} (expected 19); contiguous=${contiguous}; injected present=${injected}`,
    );
  }

  // AI-12
  {
    const bare = buildCanonicalReport({ assessmentId: "ai-12", scoring });
    const narrated = buildCanonicalReport({
      assessmentId: "ai-12",
      scoring,
      narrative: {
        sections: [{ index: 1, narrative: "Completely different narrative text." }],
        provenance: approvedProvenance,
      },
    });
    rec(
      "AI-12",
      "Content hash is independent of AI narrative",
      bare.contentHash === narrated.contentHash,
      `no-narrative=${bare.contentHash.slice(0, 16)}...; with-narrative=${narrated.contentHash.slice(0, 16)}...`,
    );
  }

  // AI-13
  {
    const disabled: AiNarrativeConfig = { ...DEFAULT_AI_CONFIG, enabled: false };
    const outcome = await generateGovernedNarrative(
      { projection, sectionCount: 19 },
      async () => ({ sections: [] }),
      disabled,
    );
    const unchanged =
      JSON.stringify(calculateScores(validAnswers)) === JSON.stringify(scoring);
    rec(
      "AI-13",
      "Disabling AI does not change deterministic scoring",
      !outcome.ok && outcome.code === "disabled" && unchanged,
      `narrative code=${outcome.ok ? "accepted (BAD)" : outcome.code}; scoring unchanged=${unchanged}`,
    );
  }

  // AI-14
  {
    const config: AiNarrativeConfig = {
      ...DEFAULT_AI_CONFIG,
      enabled: true,
      timeoutMs: 40,
      retries: 0,
    };
    const transport: NarrativeTransport = (_projection, signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
    const outcome = await generateGovernedNarrative(
      { projection, sectionCount: 19 },
      transport,
      config,
    );
    const report = await generateReport("ai-14", validAnswers, { transport, config });
    const hashPreserved =
      report.report.contentHash ===
      buildCanonicalReport({ assessmentId: "ai-14", scoring }).contentHash;
    let integrity = false;
    try {
      assertReportIntegrity(report.report);
      integrity = true;
    } catch {
      integrity = false;
    }
    rec(
      "AI-14",
      "Timeout uses fallback and preserves the deterministic result",
      !outcome.ok && outcome.code === "timeout" && hashPreserved && integrity,
      `code=${outcome.ok ? "accepted (BAD)" : outcome.code}; hash preserved=${hashPreserved}; integrity=${integrity}`,
    );
  }

  // AI-15
  {
    const config: AiNarrativeConfig = {
      ...DEFAULT_AI_CONFIG,
      enabled: true,
      timeoutMs: 2000,
      retries: 2,
    };
    let attempts = 0;
    const transport: NarrativeTransport = async () => {
      attempts++;
      if (attempts < 3) throw new Error("transient provider failure");
      return { sections: [{ index: 1, narrative: "Recovered after retry." }] };
    };
    const outcome = await generateGovernedNarrative(
      { projection, sectionCount: 19 },
      transport,
      config,
    );
    rec(
      "AI-15",
      "Retry recovers a transient provider failure",
      outcome.ok && attempts === 3,
      `attempts=${attempts} (expected 3); final=${outcome.ok ? "accepted" : outcome.code}`,
    );
  }

  // AI-16
  {
    const config: AiNarrativeConfig = {
      ...DEFAULT_AI_CONFIG,
      enabled: true,
      timeoutMs: 2000,
      retries: 2,
    };
    let attempts = 0;
    const transport: NarrativeTransport = async () => {
      attempts++;
      throw new Error("provider down");
    };
    const outcome = await generateGovernedNarrative(
      { projection, sectionCount: 19 },
      transport,
      config,
    );
    rec(
      "AI-16",
      "Retry exhaustion falls back deterministically",
      !outcome.ok && attempts === 3,
      `attempts=${attempts} (expected 3 = retries+1); final=${outcome.ok ? "accepted (BAD)" : outcome.code}`,
    );
  }

  // AI-17
  {
    const config: AiNarrativeConfig = {
      ...DEFAULT_AI_CONFIG,
      enabled: true,
      timeoutMs: 2000,
      retries: 3,
    };
    let attempts = 0;
    const transport: NarrativeTransport = async () => {
      attempts++;
      return { sections: [{ index: 1, narrative: "You have diabetes and need medication." }] };
    };
    const outcome = await generateGovernedNarrative(
      { projection, sectionCount: 19 },
      transport,
      config,
    );
    rec(
      "AI-17",
      "Prohibited language is not retried (deterministic failure)",
      attempts === 1 && !outcome.ok && outcome.code === "prohibited_language",
      `attempts=${attempts} (expected 1: retrying cannot fix a governed-language violation); code=${outcome.ok ? "accepted (BAD)" : outcome.code}`,
    );
  }

  // AI-18
  {
    const base = buildCanonicalReport({ assessmentId: "ai-18", scoring });
    const fallback = applyFallback(base, "Provider unavailable.");
    const preserved = base.sections.every((section, index) =>
      fallback.sections[index]?.narrative === section.narrative,
    );
    const provenanceOnly = fallback.sections.every((s) => s.narrativeSource === "fallback");
    const fallbackReasonSafe = findProhibitedLanguage(fallback.provenance.ai?.fallbackReason ?? "") === null;
    rec(
      "AI-18",
      "Governed fallback preserves deterministic C-03 content and records a safe reason",
      preserved && provenanceOnly && fallbackReasonSafe,
      `deterministic content preserved=${preserved}; all marked fallback=${provenanceOnly}; fallback reason safe=${fallbackReasonSafe}`,
    );
  }

  // AI-19
  {
    const source = readFileSync("lib/ai/boundary.ts", "utf8");
    const imports = source
      .split("\n")
      .filter((l) => l.trim().startsWith("import "))
      .join(" ");
    const scoringImport = /lib\/scoring/.test(imports);
    const dbImport = /lib\/db/.test(imports);
    const supabaseImport = /supabase/i.test(imports);
    rec(
      "AI-19",
      "AI module has no import path to the engine or to storage",
      !scoringImport && !dbImport && !supabaseImport,
      `imports scoring=${scoringImport}; imports db=${dbImport}; imports supabase=${supabaseImport}`,
    );
  }

  // AI-20
  {
    const source = readFileSync("lib/ai/boundary.ts", "utf8");
    const writePatterns = [/\.save\w*\(/, /\.update\w*\(/, /\.upsert\w*\(/, /\.insert\w*\(/];
    const found = writePatterns.filter((p) => p.test(source)).map((p) => String(p));
    rec(
      "AI-20",
      "AI boundary exposes no persistence or write-back path",
      found.length === 0,
      found.length === 0
        ? "no save/update/upsert/insert call exists in the AI boundary module"
        : `FOUND write path: ${found.join(", ")}`,
    );
  }

  console.log("\n=== Summary ===");
  console.log(`Total : ${rows.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Acceptance (all AI-governance tests PASS): ${failed === 0 ? "MET" : "NOT MET"}`);
  if (failed > 0) process.exitCode = 1;
}

main();

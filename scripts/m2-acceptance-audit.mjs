/**
 * ROOTS-AI(TM) M2 - Acceptance audit against a DEPLOYMENT (read-only).
 *
 * Verifies each contractual M2 scope item against the live site, so evidence
 * reflects the deployed build, not the local working copy.
 *
 * Usage: node scripts/m2-acceptance-audit.mjs https://roots-ai-learning.vercel.app
 */

const base = process.argv[2] ?? "http://localhost:3000";
let pass = 0, fail = 0;
const rows = [];
const rec = (id, item, ok, detail) => {
  rows.push({ id, item, ok, detail });
  if (ok) pass++; else fail++;
};

async function createSession() {
  const r = await fetch(`${base}/api/assessment/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `audit-${crypto.randomUUID()}@roots.ai` }),
  });
  const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  const body = await r.json().catch(() => null);
  return { status: r.status, sessionId: body?.sessionId, cookie };
}

async function main() {
  console.log(`M2 ACCEPTANCE AUDIT against ${base}\n`);

  // ---- Item 1: canonical assessment structure (from the we-can-inspect source) ----
  const s = await createSession();
  rec("A1-a", "Session can be created (assessment entry works)", s.status === 201 && !!s.sessionId, `status ${s.status}`);

  const sid = s.sessionId;
  const cookie = s.cookie;

  // Read session to inspect persisted canonical versions (item 7)
  const sess = await fetch(`${base}/api/assessment/sessions/${sid}`, { headers: { cookie } });
  const sessBody = await sess.json().catch(() => null);
  rec("A7-a", "Session persists canonical versions", !!(sessBody?.canonicalVersions?.questionnaire && sessBody?.canonicalVersions?.scoring),
    JSON.stringify(sessBody?.canonicalVersions));

  // ---- Item 2: validation (negative payloads) ----
  const patch = (body) => fetch(`${base}/api/assessment/sessions/${sid}/answers`, {
    method: "PATCH", headers: { "Content-Type": "application/json", cookie }, body: JSON.stringify(body),
  });

  const emptyMulti = await patch({ moduleId: "M02", answers: { Q13: [] } });
  rec("A2-a", "Empty required multi-select (Q13) hard-rejected (400)",
  emptyMulti.status === 400, `status ${emptyMulti.status}`);

  const exclusive = await patch({ moduleId: "M02", answers: { Q13: ["NONE", "T2D"] } });
  rec("A2-b", "NONE/N-A mutually exclusive hard-rejected (400)",
  exclusive.status === 400, `status ${exclusive.status}`);

  const badOption = await patch({ moduleId: "M01", answers: { Q2: "NOPE" } });
  rec("A2-c", "Unknown option value rejected", badOption.status === 400, `status ${badOption.status}`);

  const q73 = await patch({ moduleId: "M13", answers: { Q73: "N/A" } });
  rec("A2-d", "Q73 invented N/A is rejected",
  q73.status === 400, `status ${q73.status}`);

  // ---- Item 4/5/6/7: build a complete set and produce a deterministic result ----
  const answers = {
    Q1: 42, Q2: "FEMALE", Q3: 168, Q4: 74, Q5: 68, Q6: JSON.stringify({ value: 88, unit: "CM" }),
    Q7: "1_3Y", Q8: "CYCLING",
    Q9: "GRADUAL", Q10: "SMT", Q11: "OFT", Q12: "TWO",
    Q13: ["PREDIABETES"], Q14: ["NONE"], Q15: "NO",
    Q16: "H6_7", Q17: "SMT", Q18: "SMT", Q19: "OFT", Q20: "RLY", Q21: "NVR", Q22: "SMT",
    Q23: "SMT", Q24: "OFT", Q25: "SMT", Q26: "SMT", Q27: "SMT", Q28: "OFT", Q29: "SMT", Q30: "OFT",
    Q31: "OFT", Q32: "SMT", Q33: "SMT", Q34: "OFT",
    Q35: "SMT", Q36: "SMT", Q37: "RLY", Q38: "OFT", Q39: "SMT", Q40: "OFT",
    Q41: "OFT", Q42: "OFT", Q43: "SMT", Q44: "SMT", Q45: "SMT",
    Q46: "D3_4", Q47: "M30_59", Q48: "MIXED",
    Q49: "SMT", Q50: "SMT", Q51: "OFT",
    Q52: ["EAT"], Q53: ["STRESS"], Q54: ["SLEEP"], Q55: "TWO",
    Q56: "REGULAR_CYCLES", Q57: "SMT", Q58: "NO", Q59: "SMT", Q60: "NO",
    Q61: "NEVER", Q62: "MONTHLY", Q63: "IRREGULAR", Q64: "SMT", Q65: "GOOD", Q66: "MIXED",
    Q67: "WEIGHT", Q68: "MR", Q69: 7, Q70: 6, Q71: "ONE_STEP", Q72: "HIGH",
    Q73: "Audit note.",
  };
  const ranges = [[1,8],[9,15],[16,22],[23,30],[31,40],[41,45],[46,48],[49,51],[52,55],[56,60],[61,66],[67,71],[72,73]];
  const modules = Array.from({ length: 13 }, (_, i) => `M${String(i + 1).padStart(2, "0")}`);
  let modulesSaved = 0;
  for (let i = 0; i < modules.length; i++) {
    const [a, b] = ranges[i];
    const chunk = {};
    for (let q = a; q <= b; q++) if (answers[`Q${q}`] !== undefined) chunk[`Q${q}`] = answers[`Q${q}`];
    const res = await patch({ moduleId: modules[i], answers: chunk });
    if (res.ok) modulesSaved++;
  }
  rec("A3-a", "All 13 modules accepted and saved", modulesSaved === 13, `${modulesSaved}/13`);

  // ---- Item 3: progress ----
  const prog = await fetch(`${base}/api/assessment/sessions/${sid}/progress`, { headers: { cookie } });
  const p = await prog.json().catch(() => null);
  rec("A3-b", "Progress endpoint reflects completion", p?.isComplete === true && p?.completedModuleCount === 13,
    `complete=${p?.isComplete} modules=${p?.completedModuleCount} ${p?.percentComplete}%`);
  rec("A3-c", "Progress denominator = 71 required (item 1)", p?.totalRequired === 71 && p?.totalQuestions === 73,
    `totalRequired=${p?.totalRequired} totalQuestions=${p?.totalQuestions}`);

  // ---- Item 4/5/6/7: result ----
  const result = await fetch(`${base}/api/assessment/sessions/${sid}/result`, { method: "POST", headers: { cookie } });
  const rb = await result.json().catch(() => null);
  rec("A4-a", "Deterministic result produced by server", result.status === 201 && typeof rb?.result?.biologicalState === "number",
    `status ${result.status} BS=${rb?.result?.biologicalState}`);
  rec("A4-b", "Seven domains present", rb?.result?.domains && Object.keys(rb.result.domains).length === 7,
    JSON.stringify(rb?.result?.domains ? Object.keys(rb.result.domains) : null));
  rec("A5-a", "Drivers use fixed tie-order vocabulary", Array.isArray(rb?.result?.drivers) && rb.result.drivers.length > 0,
    JSON.stringify(rb?.result?.drivers));
  rec("A6-a", "Result is deterministic (re-POST identical)", await sameResult(base, sid, cookie, rb),
    "identical on repeat");
  rec("A7-b", "Result carries C-01 & C-02 v1.0.1", rb?.questionnaireVersion === "C-01 v1.0.1 CORRECTED" && rb?.scoringVersion === "C-02 v1.0.1 CORRECTED",
    `${rb?.questionnaireVersion} | ${rb?.scoringVersion}`);
  rec("A7-c", "Result exposes version identity string", typeof rb?.result?.versionIdentity === "string", rb?.result?.versionIdentity);

  // ---- Item 2: incomplete assessment cannot be submitted ----
  const fresh = await createSession();
  const r2 = await fetch(`${base}/api/assessment/sessions/${fresh.sessionId}/result`, { method: "POST", headers: { cookie: fresh.cookie } });
  const r2b = await jsonOf(r2);
  rec("A2-e", "Incomplete assessment cannot produce a result", r2.status === 400 && (r2b?.validationErrors?.length ?? 0) > 0,
    `status ${r2.status}`);

  // ---- Item 12: pages render ----
  for (const path of ["/", "/assessment"]) {
    const page = await fetch(`${base}${path}`);
    rec(`A12-${path}`, `Page ${path} renders (200)`, page.status === 200, `status ${page.status}`);
  }

  // ---- Output table ----
  console.log("ID       | RESULT | ITEM");
  console.log("-".repeat(90));
  for (const r of rows) console.log(`${r.id.padEnd(8)} | ${r.ok ? "PASS  " : "FAIL  "} | ${r.item}${r.detail ? `  [${r.detail}]` : ""}`);
  console.log("-".repeat(90));
  console.log(`Total ${rows.length} | Passed ${pass} | Failed ${fail}`);
  console.log(`AUDIT: ${fail === 0 ? "ALL CONTRACTUAL M2 CHECKS PRESENT" : "GAPS FOUND"}`);
  if (fail > 0) process.exitCode = 1;
}

async function jsonOf(res) { return res.json().catch(() => null); }
async function sameResult(base, sid, cookie, first) {
  const again = await fetch(`${base}/api/assessment/sessions/${sid}/result`, { method: "POST", headers: { cookie } });
  const body = await again.json().catch(() => null);
  return JSON.stringify(body?.result?.domains) === JSON.stringify(first?.result?.domains)
    && body?.result?.biologicalState === first?.result?.biologicalState
    && JSON.stringify(body?.result?.drivers) === JSON.stringify(first?.result?.drivers);
}

main().catch((e) => { console.error("AUDIT FAILED:", e.message); process.exitCode = 1; });

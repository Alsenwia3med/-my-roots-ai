/**
 * ROOTS-AI(TM) M2 - End-to-end flow test (local or deployment).
 *
 * Creates a session, answers all 13 modules with valid canonical values,
 * asserts progress advances, then produces and verifies a deterministic result.
 *
 * Usage: node scripts/e2e-flow.mjs [baseUrl]
 */

const baseUrl = process.argv[2] ?? "http://localhost:3000";
let pass = 0;
let fail = 0;
const record = (id, desc, ok, detail) => {
  if (ok) pass++;
  else fail++;
  console.log(`${id.padEnd(8)} | ${ok ? "PASS" : "FAIL"} | ${desc}${detail ? ` -> ${detail}` : ""}`);
};

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
  Q73: "I would like the report to mention my evening cravings.",
};

async function main() {
  console.log(`ROOTS-AI(TM) M2 End-to-End Flow against ${baseUrl}\n`);

  const created = await fetch(`${baseUrl}/api/assessment/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `e2e-${crypto.randomUUID()}@example.com` }),
  });
  const cookie = (created.headers.get("set-cookie") ?? "").split(";")[0];
  const { sessionId } = await created.json();
  record("E2E-01", "Session created", !!sessionId, sessionId);

  const moduleIds = Array.from({ length: 13 }, (_, i) => `M${String(i + 1).padStart(2, "0")}`);
  const ranges = [[1, 8], [9, 15], [16, 22], [23, 30], [31, 40], [41, 45], [46, 48], [49, 51], [52, 55], [56, 60], [61, 66], [67, 71], [72, 73]];

  for (let i = 0; i < moduleIds.length; i++) {
    const [start, end] = ranges[i];
    const chunk = {};
    for (let q = start; q <= end; q++) {
      if (answers[`Q${q}`] !== undefined) chunk[`Q${q}`] = answers[`Q${q}`];
    }
    const res = await fetch(`${baseUrl}/api/assessment/sessions/${sessionId}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ moduleId: moduleIds[i], answers: chunk }),
    });
    const body = await res.json().catch(() => null);
    const flagged = Array.isArray(body?.validationErrors) && body.validationErrors.length > 0;
    record(`E2E-${String(i + 2).padStart(2, "0")}`, `Module ${moduleIds[i]} saved`, res.ok && !flagged, res.ok ? `status ${res.status}` : `status ${res.status} ${JSON.stringify(body)}`);
  }

  const progress = await fetch(`${baseUrl}/api/assessment/sessions/${sessionId}/progress`, { headers: { cookie } });
  const p = await progress.json();
  record("E2E-15", "Progress reports complete", p?.isComplete === true, `answered ${p?.answeredRequired}/${p?.totalRequired}, ${p?.percentComplete}%`);

  const result = await fetch(`${baseUrl}/api/assessment/sessions/${sessionId}/result`, { method: "POST", headers: { cookie } });
  const r = await result.json();
  record("E2E-16", "Result produced", result.status === 201, `status ${result.status}`);
  record("E2E-17", "Result carries scoring version", r?.scoringVersion === "C-02 v1.0.1 CORRECTED", r?.scoringVersion);
  record("E2E-18", "Biological State computed", typeof r?.result?.biologicalState === "number", `BS ${r?.result?.biologicalState}`);
  record("E2E-19", "Drivers present and eligible", Array.isArray(r?.result?.drivers) && r.result.drivers.length > 0, JSON.stringify(r?.result?.drivers));
  record("E2E-20", "Version identity recorded", typeof r?.result?.versionIdentity === "string", r?.result?.versionIdentity);

  console.log(`\n=== Summary ===\nPassed: ${pass}  Failed: ${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("E2E flow failed:", e.message);
  process.exitCode = 1;
});

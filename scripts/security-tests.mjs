/**
 * ROOTS-AI(TM) M2 - Security and negative tests.
 *
 * Demonstrates, against the running application:
 *   - unauthorized access to protected assessment/scoring data is rejected
 *   - cross-user access is rejected
 *   - invalid inputs cannot bypass the canonical assessment/scoring controls
 *
 * Usage: start the app (npm run dev or npm start), then
 *   node scripts/security-tests.mjs [baseUrl]
 *
 * The script uses only built-in fetch and asserts on HTTP status codes and
 * response bodies, so it can run in CI against a deployment.
 */

const baseUrl =
  process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";

let pass = 0;
let fail = 0;

function record(id, description, ok, detail) {
  if (ok) pass++;
  else fail++;
  console.log(
    `${id.padEnd(10)} | ${ok ? "PASS" : "FAIL"} | ${description}${detail ? ` -> ${detail}` : ""}`,
  );
}

async function json(response) {
  return response.json().catch(() => null);
}

async function main() {
  console.log(`ROOTS-AI(TM) M2 Security / Negative Tests against ${baseUrl}\n`);

  // Create two independent sessions (two users).
  const create = async () => {
    const r = await fetch(`${baseUrl}/api/assessment/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `user-${crypto.randomUUID()}@example.com`,
      }),
    });
    const cookie = r.headers.get("set-cookie") ?? "";
    const body = await json(r);
    return { sessionId: body?.sessionId, cookie };
  };

  const userA = await create();
  const userB = await create();

  record(
    "SEC-01",
    "User A session created",
    !!userA.sessionId,
    userA.sessionId,
  );
  record(
    "SEC-02",
    "User B session created",
    !!userB.sessionId,
    userB.sessionId,
  );

  // 1. Unauthenticated access (no cookie) to a session.
  const noCookie = await fetch(
    `${baseUrl}/api/assessment/sessions/${userA.sessionId}`,
  );
  record(
    "SEC-03",
    "No cookie cannot read a session",
    noCookie.status === 403 || noCookie.status === 404,
    `status ${noCookie.status}`,
  );

  // 2. Cross-user access: B's cookie tries to read A's session.
  const sessionCookieB = userB.cookie.split(";")[0];
  const cross = await fetch(
    `${baseUrl}/api/assessment/sessions/${userA.sessionId}`,
    {
      headers: { cookie: sessionCookieB },
    },
  );
  record(
    "SEC-04",
    "Cross-user session read is rejected",
    cross.status === 403,
    `status ${cross.status}`,
  );

  // 3. Cross-user answers write is rejected.
  const crossWrite = await fetch(
    `${baseUrl}/api/assessment/sessions/${userA.sessionId}/answers`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: sessionCookieB },
      body: JSON.stringify({ moduleId: "M01", answers: { Q1: 40 } }),
    },
  );
  record(
    "SEC-05",
    "Cross-user answer write is rejected",
    crossWrite.status === 403,
    `status ${crossWrite.status}`,
  );

  // 4. Cross-user progress read is rejected.
  const crossProgress = await fetch(
    `${baseUrl}/api/assessment/sessions/${userA.sessionId}/progress`,
    {
      headers: { cookie: sessionCookieB },
    },
  );
  record(
    "SEC-06",
    "Cross-user progress read is rejected",
    crossProgress.status === 403,
    `status ${crossProgress.status}`,
  );

  // 5. Cross-user result read is rejected.
  const crossResult = await fetch(
    `${baseUrl}/api/assessment/sessions/${userA.sessionId}/result`,
    {
      headers: { cookie: sessionCookieB },
    },
  );
  record(
    "SEC-07",
    "Cross-user result read is rejected",
    crossResult.status === 403,
    `status ${crossResult.status}`,
  );

  // --- Invalid input / bypass attempts, using A's own valid session cookie. ---
  const sessionCookieA = userA.cookie.split(";")[0];
  const patch = (body) =>
    fetch(`${baseUrl}/api/assessment/sessions/${userA.sessionId}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: sessionCookieA },
      body: JSON.stringify(body),
    });

  // 6. Unknown module rejected.
  const badModule = await patch({ moduleId: "M99", answers: {} });
  record(
    "SEC-08",
    "Unknown module rejected",
    badModule.status === 400,
    `status ${badModule.status}`,
  );

  // 7. Cross-module answer injection rejected (Q1 is not in M02).
  const foreignQ = await patch({ moduleId: "M02", answers: { Q1: 40 } });
  record(
    "SEC-09",
    "Cross-module question injection rejected",
    foreignQ.status === 400,
    `status ${foreignQ.status}`,
  );

  // 8. Invalid option value rejected for a single-select question.
  const badOption = await patch({
    moduleId: "M01",
    answers: { Q2: "NOT_AN_OPTION" },
  });
  record(
    "SEC-10",
    "Unknown option value rejected",
    badOption.status === 400,
    `status ${badOption.status}`,
  );

  // 9. Required multi-select empty array rejected/flagged.
  const emptyMulti = await patch({ moduleId: "M02", answers: { Q13: [] } });
  const emptyBody = await json(emptyMulti);
  const emptyFlagged =
    emptyMulti.status === 400 || (emptyBody?.validationErrors?.length ?? 0) > 0;
  record(
    "SEC-11",
    "Empty required multi-select is flagged",
    emptyFlagged,
    `status ${emptyMulti.status}`,
  );

  // 10. NONE / N/A mutual exclusivity enforced for a multi-select.
  const exclusive = await patch({
    moduleId: "M02",
    answers: { Q13: ["NONE", "T2D"] },
  });
  const exclusiveBody = await json(exclusive);
  const exclusiveFlagged =
    exclusive.status === 400 ||
    (exclusiveBody?.validationErrors?.length ?? 0) > 0;
  record(
    "SEC-12",
    "NONE combined with another option is flagged",
    exclusiveFlagged,
    `status ${exclusive.status}`,
  );

  // 11. Incomplete assessment cannot produce a result.
  const result = await fetch(
    `${baseUrl}/api/assessment/sessions/${userA.sessionId}/result`,
    {
      method: "POST",
      headers: { cookie: sessionCookieA },
    },
  );
  const resultBody = await json(result);
  record(
    "SEC-13",
    "Incomplete assessment cannot produce a result",
    result.status === 400 && (resultBody?.validationErrors?.length ?? 0) > 0,
    `status ${result.status}`,
  );

  // 12. Unauthenticated result creation rejected.
  const anonResult = await fetch(
    `${baseUrl}/api/assessment/sessions/${userA.sessionId}/result`,
    { method: "POST" },
  );
  record(
    "SEC-14",
    "Unauthenticated result creation rejected",
    anonResult.status === 403,
    `status ${anonResult.status}`,
  );

  // 13. Invalid email cannot create a session.
  const badEmail = await fetch(`${baseUrl}/api/assessment/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  });
  record(
    "SEC-15",
    "Invalid email rejected at session creation",
    badEmail.status === 400,
    `status ${badEmail.status}`,
  );

  // ==========================================================================
  // Additional canonical assessment / scoring control cases.
  // These exercise the C-01 option controls and the C-02 scoring authority at
  // the API boundary: a caller must not be able to place a value in storage
  // that the controlled sources do not define, nor obtain a result without a
  // complete, valid assessment.
  // ==========================================================================

  // 14. A valid session cookie cannot be used for another session id.
  const forgedCookie = await fetch(
    `${baseUrl}/api/assessment/sessions/${userB.sessionId}`,
    { headers: { cookie: sessionCookieA } },
  );
  record(
    "SEC-16",
    "Cookie/session-id mismatch rejected (no id substitution)",
    forgedCookie.status === 403,
    `status ${forgedCookie.status}`,
  );

  // 15. Unknown question id inside the correct module is rejected.
  const unknownQuestion = await patch({ moduleId: "M01", answers: { Q999: 40 } });
  record(
    "SEC-17",
    "Unknown question id rejected",
    unknownQuestion.status === 400,
    `status ${unknownQuestion.status}`,
  );

  // 16. N/A where C-01 forbids N/A (Q1 is an integer) is rejected.
  const forbiddenNa = await patch({ moduleId: "M01", answers: { Q1: "NA" } });
  record(
    "SEC-18",
    "N/A on a question that does not permit it is rejected",
    forbiddenNa.status === 400,
    `status ${forbiddenNa.status}`,
  );

  // 17. Out-of-range integer is rejected by canonical range validation.
  const outOfRange = await patch({ moduleId: "M01", answers: { Q1: 1000 } });
  record(
    "SEC-19",
    "Out-of-range numeric response rejected",
    outOfRange.status === 400,
    `status ${outOfRange.status}`,
  );

  // 18. A non-numeric value on a numeric question is rejected.
  const notANumber = await patch({ moduleId: "M01", answers: { Q1: "forty" } });
  record(
    "SEC-20",
    "Non-numeric response to a numeric question rejected",
    notANumber.status === 400,
    `status ${notANumber.status}`,
  );

  // 19. Q73 optional free text must reject an invented N/A.
  const inventedNa = await patch({ moduleId: "M13", answers: { Q73: "N/A" } });
  record(
    "SEC-21",
    "Invented N/A on optional free text (Q73) rejected",
    inventedNa.status === 400,
    `status ${inventedNa.status}`,
  );

  // 20. Unknown option on a required multi-select is rejected.
  const badMulti = await patch({
    moduleId: "M02",
    answers: { Q13: ["NOT_A_CONDITION"] },
  });
  record(
    "SEC-22",
    "Unknown option in a required multi-select rejected",
    badMulti.status === 400,
    `status ${badMulti.status}`,
  );

  // 21. NONE plus a real option on Q14 is rejected (mutual exclusivity).
  const exclusiveQ14 = await patch({
    moduleId: "M02",
    answers: { Q14: ["NONE", "GLUCOSE"] },
  });
  record(
    "SEC-23",
    "NONE combined with another option on Q14 rejected",
    exclusiveQ14.status === 400,
    `status ${exclusiveQ14.status}`,
  );

  // 22. NONE plus a real option on Q52 is rejected.
  const exclusiveQ52 = await patch({
    moduleId: "M09",
    answers: { Q52: ["NONE", "EAT"] },
  });
  record(
    "SEC-24",
    "NONE combined with another option on Q52 rejected",
    exclusiveQ52.status === 400,
    `status ${exclusiveQ52.status}`,
  );

  // 23. A guarded question cannot be bypassed by dropping it from the payload:
  //     the module save validates the MERGED answer set, so re-submitting the
  //     module without the offending key still sees the stored value. Prove the
  //     control holds when the same module is re-submitted with a valid value
  //     and then probed with the invalid one again.
  const resubmit = await patch({ moduleId: "M02", answers: { Q13: ["NONE"] } });
  const recheck = await patch({ moduleId: "M02", answers: { Q13: [] } });
  record(
    "SEC-25",
    "Empty required multi-select still rejected after a prior valid save",
    resubmit.status === 200 && recheck.status === 400,
    `resubmit ${resubmit.status}, recheck ${recheck.status}`,
  );

  // 24. An unauthenticated caller cannot create a result even with a valid id.
  const anonResultPost = await fetch(
    `${baseUrl}/api/assessment/sessions/${userB.sessionId}/result`,
    { method: "POST" },
  );
  record(
    "SEC-26",
    "Unauthenticated result creation rejected on any session",
    anonResultPost.status === 403,
    `status ${anonResultPost.status}`,
  );

  // 25. An unauthenticated caller cannot write answers.
  const anonWrite = await fetch(
    `${baseUrl}/api/assessment/sessions/${userB.sessionId}/answers`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: "M01", answers: { Q1: 40 } }),
    },
  );
  record(
    "SEC-27",
    "Unauthenticated answer write rejected",
    anonWrite.status === 403,
    `status ${anonWrite.status}`,
  );

  // 26. A malformed body (missing answers) is rejected, not silently accepted.
  const malformed = await fetch(
    `${baseUrl}/api/assessment/sessions/${userA.sessionId}/answers`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: sessionCookieA },
      body: JSON.stringify({ moduleId: "M01" }),
    },
  );
  record(
    "SEC-28",
    "Malformed answer payload rejected",
    malformed.status === 400,
    `status ${malformed.status}`,
  );

  // 27. A non-JSON body is rejected rather than throwing a 500.
  const nonJson = await fetch(
    `${baseUrl}/api/assessment/sessions/${userA.sessionId}/answers`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: sessionCookieA },
      body: "not-json-at-all",
    },
  );
  record(
    "SEC-29",
    "Non-JSON body rejected with a client error (no 5xx)",
    nonJson.status >= 400 && nonJson.status < 500,
    `status ${nonJson.status}`,
  );

  // 28. An unknown session id cannot be read, even with a well-formed cookie.
  const ghost = await fetch(
    `${baseUrl}/api/assessment/sessions/00000000-0000-4000-8000-000000000000`,
    { headers: { cookie: "roots_session_id=00000000-0000-4000-8000-000000000000" } },
  );
  record(
    "SEC-30",
    "Unknown session id yields no data (403/404)",
    ghost.status === 403 || ghost.status === 404,
    `status ${ghost.status}`,
  );

  // 29. The result route must never expose another user's scoring data.
  const crossResultPost = await fetch(
    `${baseUrl}/api/assessment/sessions/${userA.sessionId}/result`,
    { method: "POST", headers: { cookie: sessionCookieB } },
  );
  record(
    "SEC-31",
    "Cross-user result creation rejected",
    crossResultPost.status === 403,
    `status ${crossResultPost.status}`,
  );

  console.log(`\n=== Summary ===\nPassed: ${pass}  Failed: ${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Security test run failed:", error.message);
  process.exitCode = 1;
});

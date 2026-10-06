import { SHELL, FORBIDDEN } from "./_parity-data.mjs";
import { REQUIRED } from "./_parity-required-a.mjs";
import { REQUIRED_B } from "./_parity-required-b.mjs";
import { REQUIRED_C } from "./_parity-required-c.mjs";

const ORIGIN = process.env.ORIGIN ?? "http://localhost:3000";
const ALL = { ...REQUIRED, ...REQUIRED_B, ...REQUIRED_C };

const ENTITIES = {
  "&amp;": "&", "&quot;": '"', "&#x27;": "'", "&#39;": "'", "&nbsp;": " ",
  "&mdash;": "\u2014", "&ndash;": "\u2013", "&rsquo;": "\u2019",
  "&ldquo;": "\u201c", "&rdquo;": "\u201d", "&#8220;": "\u201c", "&#8221;": "\u201d",
  "&trade;": "\u2122", "&#8482;": "\u2122", "&lt;": "<", "&gt;": ">",
  "&middot;": "\u00b7", "&hellip;": "\u2026",
};

function toText(html) {
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  for (const [entity, char] of Object.entries(ENTITIES)) {
    out = out.split(entity).join(char);
  }
  return out.replace(/\s+/g, " ").trim();
}

let failures = 0;
let checks = 0;
const report = [];

for (const [route, phrases] of Object.entries(ALL)) {
  const url = ORIGIN + route;
  let text;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = toText(await res.text());
  } catch (err) {
    report.push({ route, lines: [`  could not load ${url}: ${err.message}`] });
    failures += 1;
    continue;
  }

  const missing = phrases.filter((p) => !text.includes(p));
  const shellMissing = SHELL.filter((p) => !text.includes(p));
  const stale = (FORBIDDEN[route] ?? []).filter((p) => text.includes(p));
  checks += phrases.length + SHELL.length;

  if (missing.length || shellMissing.length || stale.length) {
    failures += 1;
    report.push({
      route,
      lines: [
        missing.length ? `  MISSING content: ${JSON.stringify(missing)}` : "",
        shellMissing.length ? `  MISSING shell:   ${JSON.stringify(shellMissing)}` : "",
        stale.length ? `  STALE copy:      ${JSON.stringify(stale)}` : "",
      ].filter(Boolean),
    });
  }
}

console.log(`Live-parity audit against ${ORIGIN}`);
console.log(`Checked ${Object.keys(ALL).length} routes / ${checks} phrases.\n`);
if (!failures) {
  console.log("RESULT: PASS \u2014 all controlled copy matches roots-ai.health.");
} else {
  console.log(`RESULT: FAIL \u2014 ${failures} route(s):`);
  for (const r of report) console.log(`\n- ${r.route}\n${r.lines.join("\n")}`);
  process.exitCode = 1;
}

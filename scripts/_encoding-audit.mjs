import fs from "node:fs";
import path from "node:path";

const ROOTS = ["app", "components", "lib", "data", "scripts", "public"];
const EXT = new Set([".ts", ".tsx", ".css", ".mjs", ".json", ".js", ".svg", ".sql"]);

/** Mojibake signatures produced by a UTF-8 file decoded as Windows-1252. */
const MOJIBAKE = [
  "â€", // â€  (™ — – " " ' … →)
  "Ã¢",
  "Ã©",
  "Ã¼",
  "Ã¶",
  "Ã¤",
  "Ã\u0085",
  "ï»¿", // ï»¿ (BOM re-decoded)
  "ΓÇ", // Î¿ / Î» style greek-mojibake from cp437/850
  "â\u0080",
];

const findings = [];
let scanned = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".vercel" || entry.name === ".git") continue;
      walk(full);
      continue;
    }
    if (!EXT.has(path.extname(entry.name))) continue;
    const buf = fs.readFileSync(full);
    // A valid UTF-8 file never decodes to U+FFFD. Invalid sequences surface as the
    // replacement char, which is the reliable corruption signal.
    const text = buf.toString("utf8");
    scanned += 1;
    const problems = [];
    if (text.includes("\uFFFD")) problems.push("U+FFFD replacement char (invalid UTF-8)");
    for (const sig of MOJIBAKE) {
      if (text.includes(sig)) {
        const idx = text.indexOf(sig);
        problems.push(`mojibake "${sig}" near: ${JSON.stringify(text.slice(Math.max(0, idx - 30), idx + 30))}`);
      }
    }
    if (problems.length) findings.push({ file: full, problems });
  }
}

for (const r of ROOTS) {
  if (fs.existsSync(r)) walk(r);
}

// The audit lists the mojibake signatures as literal text, so it always flags
// itself. Exclude it rather than weakening the signatures.
const SELF = path.resolve("scripts/_encoding-audit.mjs");
const results = findings.filter((f) => path.resolve(f.file) !== SELF);

console.log(`Scanned ${scanned} source files.`);
if (!results.length) {
  console.log("RESULT: clean — no encoding corruption found.");
} else {
  console.log(`RESULT: ${results.length} file(s) with problems:\n`);
  for (const f of results) {
    console.log(`- ${f.file}`);
    for (const p of f.problems) console.log(`    ${p}`);
  }
  process.exitCode = 1;
}

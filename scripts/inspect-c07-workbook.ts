// Read-only inspection of the supplied C-07 vendor-completed workbook.
// Confirms or refutes the claims: 594 atomic requirements, 558 mapped, 36 out-of-scope, 0 NOT MAPPED.
// Usage: npx tsx scripts/inspect-c07-workbook.ts <path-to-xlsx>
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const path = process.argv[2];
if (!path) {
  console.error("usage: tsx scripts/inspect-c07-workbook.ts <file.xlsx>");
  process.exit(1);
}

const wb = XLSX.read(readFileSync(path), { type: "buffer" });
console.log("sheets:", wb.SheetNames.join(", "));

for (const name of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name], { defval: "" });
  console.log(`\n=== sheet "${name}" — ${rows.length} data rows ===`);
  if (rows.length === 0) continue;

  const cols = Object.keys(rows[0]);
  console.log("columns:", cols.join(" | "));

  // Family breakdown from the requirement id, e.g. SCR-0034 -> SCR
  const idCol = cols.find((c) => /^(req(uitement)?\s*)?id$/i.test(c)) ?? cols[0];
  const fam = new Map<string, number>();
  for (const r of rows) {
    const id = String(r[idCol] ?? "");
    const f = (id.match(/^([A-Z]+)/)?.[1] ?? "?").toUpperCase();
    fam.set(f, (fam.get(f) ?? 0) + 1);
  }
  console.log("families:", [...fam.entries()].sort().map(([k, v]) => `${k}=${v}`).join(", "));

  // Vendor columns: look for a status/mapping column and count the distinct values.
  for (const c of cols) {
    if (!/status|mapping|disposition|vendor|implementation|coverage|test\s*result/i.test(c)) continue;
    const counts = new Map<string, number>();
    for (const r of rows) {
      const v = String(r[c] ?? "").trim() || "(empty)";
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    if (counts.size > 1 || [...counts.keys()].some((k) => k !== "(empty)")) {
      console.log(`  column "${c}":`, [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${JSON.stringify(k)}=${v}`).join(", "));
    }
  }
}

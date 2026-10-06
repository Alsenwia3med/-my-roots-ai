
/** Temporary: prints C-02 Option_Points for the MR activity items + a set summary. */
import XLSX from "xlsx";
import { homedir } from "node:os";
import { join } from "node:path";

type OptionPointRow = Record<string, unknown>;

const file = join(
  homedir(),
  "Desktop",
  "03_ROOTS_AI_C02_Canonical_Scoring_Rules_and_Golden_Tests_v1.0.1_CORRECTED.xlsx",
);
const wb = XLSX.readFile(file);
const rows = XLSX.utils.sheet_to_json<OptionPointRow>(wb.Sheets["Option_Points"], {
  defval: null,
});
const firstRow = rows[0] ?? {};
const keys = Object.keys(firstRow);
if (keys.length < 7) throw new Error("Option_Points sheet did not contain the expected columns.");

for (const row of rows) {
  const q = String(row[keys[0]]);
  if (["Q46", "Q47", "Q48", "Q26", "Q28", "Q9"].includes(q)) {
    console.log(
      `  ${q} | ${row[keys[1]]} | ${row[keys[2]]} | ${row[keys[3]]} | '${row[keys[4]]}' | pts=${row[keys[5]]} | na=${row[keys[6]]}`,
    );
  }
}
const sets = new Map<string, string[]>();
for (const row of rows) {
  const set = String(row[keys[2]]);
  if (!sets.has(set)) sets.set(set, []);
  const pts = row[keys[5]];
  sets.get(set)!.push(`${row[keys[3]]}:${pts === null ? "n/a" : pts}`);
}
console.log("\nSETS with points:");
for (const [set, options] of sets) {
  const hasPoints = options.some((option) => !option.endsWith("n/a"));
  console.log(
    `  ${set} ${hasPoints ? "SCORED" : "contextual"}: ${options.join(" ")}`,
  );
}

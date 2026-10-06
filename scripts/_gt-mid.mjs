/** Temporary: prints GT-011..GT-020 expected outputs from the C-02 sheet. */
import XLSX from "xlsx";
import { homedir } from "node:os";
import { join } from "node:path";

const file = join(
  homedir(),
  "Desktop",
  "03_ROOTS_AI_C02_Canonical_Scoring_Rules_and_Golden_Tests_v1.0.1_CORRECTED.xlsx",
);
const wb = XLSX.readFile(file);
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Golden_Tests"], {
  defval: null,
});
const col = Object.keys(rows[0]);
console.log("COLUMNS:", JSON.stringify(col));
for (const r of rows) {
  const id = r[col[0]];
  if (!/^GT-0(1[1-9]|20)$/.test(String(id))) continue;
  console.log(`\n${id} :: ${r[col[1]]}`);
  console.log("  IN :", r[col[2]]);
  console.log("  EXP:", r[col[3]]);
}

/** Temporary inspection helper: dumps controlled XLSX sheet shapes. */
import XLSX from "xlsx";

const files = process.argv.slice(2);
for (const file of files) {
  const wb = XLSX.readFile(file);
  console.log("\n" + "=".repeat(90));
  console.log("FILE:", file);
  console.log("SHEETS:", wb.SheetNames.join(" | "));
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {
      defval: null,
      header: 1,
    });
    console.log("\n---- SHEET:", name, "rows:", rows.length);
    for (let i = 0; i < Math.min(rows.length, 6); i++) {
      console.log(`  [${i}]`, JSON.stringify(rows[i]));
    }
    if (rows.length > 6) {
      console.log("  ...");
      console.log(
        `  [${rows.length - 1}]`,
        JSON.stringify(rows[rows.length - 1]),
      );
    }
  }
}

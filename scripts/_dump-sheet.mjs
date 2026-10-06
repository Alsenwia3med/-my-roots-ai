/** Temporary inspection helper: dumps one sheet as objects. */
import XLSX from "xlsx";

const [file, sheet] = process.argv.slice(2);
const wb = XLSX.readFile(file);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: null });
console.log("ROWS:", rows.length);
for (const row of rows) console.log(JSON.stringify(row));

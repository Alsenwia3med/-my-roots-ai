/**
 * Extract text from a controlled PDF using pdfjs-dist (installed on demand).
 * Usage: node scripts/_pdftext.mjs <file.pdf> [out.txt]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const [, , pdfPath, outPath] = process.argv;
const require = createRequire(import.meta.url);

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const data = new Uint8Array(readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

const pages = [];
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  // Rebuild lines from text items using their y position.
  let lastY = null;
  let line = [];
  const lines = [];
  for (const item of content.items) {
    const y = item.transform[5];
    if (lastY !== null && Math.abs(y - lastY) > 2) {
      lines.push(line.join(""));
      line = [];
    }
    line.push(item.str);
    lastY = y;
  }
  if (line.length) lines.push(line.join(""));
  pages.push(`\n===== PAGE ${p} =====\n` + lines.join("\n"));
}

const text = pages.join("\n");
if (outPath) writeFileSync(outPath, text, "utf8");
else process.stdout.write(text);
console.error(`extracted ${doc.numPages} pages`);
void require;

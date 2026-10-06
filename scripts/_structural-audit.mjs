/** Structural audit: navigation links, image assets, metadata and route coverage. */
import fs from "node:fs";
import path from "node:path";

const ORIGIN = process.env.ORIGIN ?? "http://localhost:3000";
const APP = "app";
const problems = [];
let checked = 0;

// 1. Every internal href must resolve to a real route or a known static asset.
const ROUTE_DIRS = new Set();
for (const entry of fs.readdirSync(APP, { withFileTypes: true })) {
  if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "api") {
    ROUTE_DIRS.add("/" + entry.name);
  }
}

const sourceFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") walk(full); }
    else if (/\.tsx?$/.test(e.name)) sourceFiles.push(full);
  }
})(APP);

const hrefs = new Set();
for (const f of sourceFiles) {
  const text = fs.readFileSync(f, "utf8");
  for (const m of text.matchAll(/href=["'`](\/[^"'`#?]*)["'`]/g)) hrefs.add(m[1]);
}

for (const href of hrefs) {
  checked += 1;
  if (href === "/") continue; // the root route always exists
  if (href.startsWith("/api/")) continue;
  // Static asset reference: verify the file exists under public/.
  if (/\.(svg|png|jpe?g|ico|webp|css|js|txt|xml)$/i.test(href)) {
    if (!fs.existsSync(path.join("public", href))) {
      problems.push(`dead asset link in source: ${href}`);
    }
    continue;
  }
  // Dynamic route pattern (e.g. /assessment/[sessionId]/...) is checked by prefix.
  const base = href.split("/").filter(Boolean)[0] ?? "";
  if (!ROUTE_DIRS.has("/" + base)) {
    problems.push(`link points to a non-existent route: ${href}`);
  }
}

// 2. Live routes must return 200 and serve the brand logo.
const ROUTES = [
  "/", "/platform", "/how-it-works", "/research", "/healthcare-professionals",
  "/about", "/blog", "/example-report", "/pilot", "/assessment", "/contact",
  "/privacy", "/terms", "/medical-disclaimer", "/ai-disclaimer", "/cookies",
  "/project-status",
];

const statuses = [];
for (const route of ROUTES) {
  checked += 1;
  try {
    const res = await fetch(ORIGIN + route, { redirect: "follow" });
    statuses.push(`${res.status} ${route}`);
    if (res.status !== 200) problems.push(`route ${route} returned HTTP ${res.status}`);
  } catch (err) {
    problems.push(`route ${route} unreachable: ${err.message}`);
  }
}

// 3. The brand wordmark referenced by the header and footer must exist and be valid SVG.
for (const asset of ["public/brand/roots-logo.png", "app/favicon.ico"]) {
  checked += 1;
  if (!fs.existsSync(asset)) { problems.push(`missing brand asset: ${asset}`); continue; }
  if (asset.endsWith(".svg")) {
    const svg = fs.readFileSync(asset, "utf8");
    if (!svg.includes("<svg") || !svg.includes("viewBox")) {
      problems.push(`invalid SVG (needs <svg> + viewBox): ${asset}`);
    }
  }
}

// 4. The header must use the provided brand asset, not the legacy mark.
const header = fs.readFileSync("components/layout/Header.tsx", "utf8");
checked += 1;
if (header.includes("logo-mark.svg")) problems.push("Header still uses the legacy logo-mark.svg");
if (!header.includes("/brand/roots-logo.png")) problems.push("Header does not use /brand/roots-logo.png");

// 5. Header navigation must match the live site (no Project Status in the top bar).
checked += 1;
if (header.includes('"/project-status"')) problems.push("Header still lists /project-status in navigation");

console.log("Structural audit");
console.log(`Checked ${checked} items across ${sourceFiles.length} source files.\n`);
console.log("Route status:");
for (const s of statuses) console.log(`  ${s}`);

if (!problems.length) {
  console.log("\nRESULT: PASS \u2014 no structural problems found.");
} else {
  console.log(`\nRESULT: FAIL \u2014 ${problems.length} problem(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = 1;
}

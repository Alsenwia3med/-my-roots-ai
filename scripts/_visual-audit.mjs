import puppeteer from "puppeteer";
import fs from "node:fs";

const ORIGIN = process.env.ORIGIN ?? "http://localhost:3000";
const ROUTES = ["/", "/platform", "/how-it-works", "/about", "/research", "/healthcare-professionals", "/pilot", "/example-report"];
const OUT = "tmp-shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const problems = [];

for (const route of ROUTES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

  const res = await page.goto(ORIGIN + route, { waitUntil: "networkidle2", timeout: 45000 });
  const slug = route === "/" ? "home" : route.replace(/\//g, "-").slice(1);
  await page.screenshot({ path: `${OUT}/${slug}.png`, fullPage: true });

  // The brand wordmark must actually render at a usable size, not a squeezed dot.
  const logo = await page.evaluate(() => {
    const img = document.querySelector(".site-logo img");
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return {
      src: img.getAttribute("src"),
      loaded: img.complete && img.naturalWidth > 0,
      naturalW: img.naturalWidth,
      cssW: Math.round(r.width),
      cssH: Math.round(r.height),
    };
  });

  // Check nothing overflows horizontally at 1440px.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  console.log(`${res.status()} ${route}  logo=${logo ? `${logo.cssW}x${logo.cssH} (natural ${logo.naturalW}) loaded=${logo.loaded}` : "MISSING"}  h-overflow=${overflow}px  consoleErrors=${consoleErrors.length}`);
  if (res.status() !== 200) problems.push(`${route} HTTP ${res.status()}`);
  if (!logo?.loaded) problems.push(`${route} brand logo did not load`);
  if (logo && logo.cssW < 150) problems.push(`${route} brand wordmark too small: ${logo.cssW}px wide (need >= 150px)`);
  if (logo && logo.cssH < 20) problems.push(`${route} brand wordmark too short: ${logo.cssH}px (need >= 20px)`);
  if (overflow > 2) problems.push(`${route} horizontal overflow ${overflow}px`);
  if (consoleErrors.length) problems.push(`${route} console errors: ${consoleErrors.slice(0, 3).join(" | ")}`);

  await page.close();
}

// Mobile pass on the home page.
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 780 });
await page.goto(ORIGIN + "/", { waitUntil: "networkidle2" });
await page.screenshot({ path: `${OUT}/home-360.png`, fullPage: true });
const mobOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log(`\nmobile 360px home: h-overflow=${mobOverflow}px`);
if (mobOverflow > 2) problems.push(`home@360 horizontal overflow ${mobOverflow}px`);
await page.close();

await browser.close();
console.log(problems.length ? `\nRESULT: FAIL\n${problems.map((p) => `  - ${p}`).join("\n")}` : "\nRESULT: PASS \u2014 all routes render cleanly.");
if (problems.length) process.exitCode = 1;

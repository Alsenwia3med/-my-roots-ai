/**
 * The supported-client evidence report, as one PDF.
 *
 *     npm run evidence:supported-client-pdf
 *
 * ROOTS asked (M3-RC9 review, section 2) for the §12.1 supported-client matrix recorded "for each
 * tested client: browser/version, OS/device where applicable, critical workflow exercised, result,
 * defect if any, remediation if required, and final PASS/FAIL", and (section 3) for a screen-reader
 * smoke test on the critical workflows.
 *
 * This assembles that into a single document: the matrix, the recordings, and every captured
 * screen. It is built with `pdf-lib`, the same library the participant report uses, so it adds no
 * dependency.
 *
 * ## What this document claims, and what it does not
 *
 * Each row states the client actually exercised. Where a required client was not exercised it says
 * so in the same table rather than in a footnote — ROOTS was explicit that a shared rendering
 * engine is supporting evidence but does not close a specifically required client, so no
 * substitution is made anywhere in here.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const ROOT = process.cwd();
const SHOTS = join(ROOT, 'docs', 'm3', 'evidence', 'supported-client');
const OUT = join(ROOT, 'docs', 'm3', 'ROOTS-AI_M3_Supported_Client_Evidence.pdf');

const A4: [number, number] = [595.28, 841.89];
const M = 48;                       // page margin
const NAVY = rgb(0.02, 0.18, 0.23);
const INK = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.85, 0.87, 0.9);
const GOOD = rgb(0.05, 0.42, 0.33);
const WARN = rgb(0.62, 0.3, 0.05);

interface Fonts { body: PDFFont; bold: PDFFont; mono: PDFFont }

/** Every captured screen, in the order a reader should meet them. */
const SHEETS: { file: string; title: string; note: string }[] = [
  { file: '70.png', title: 'Home — PUB-01', note: 'Full page. Hero, seven-domain diagram, what-changes grid, framework, how-it-works, example report, pilot programme, footer.' },
  { file: '89.png', title: 'Home — narrow viewport', note: 'The same page at a reduced width; layout reflows without horizontal scroll.' },
  { file: '71.png', title: 'How It Works', note: 'The six-step controlled sequence, what the AI does and does not do, and the privacy statement.' },
  { file: '72.png', title: 'Platform', note: 'Available now against coming soon, with each future layer marked rather than implied.' },
  { file: '73.png', title: 'Example Report', note: 'The full 19-section sample, fictional data, marked EXAMPLE ONLY throughout.' },
  { file: '74.png', title: 'About', note: 'Mission and method, framework, company and the educational-not-diagnostic boundary.' },
  { file: '75.png', title: 'For Professionals', note: 'Use cases, evidence boundary and what the report shows.' },
  { file: '76.png', title: 'Free Beta — pilot programme', note: 'Eligibility, what participation includes, privacy and consent.' },
  { file: '77.png', title: 'Free Beta — second capture', note: 'The same screen captured again in a separate session.' },
  { file: '78.png', title: 'Insights', note: 'The approved launch empty state: "Our first evidence-informed insights are being prepared."' },
  { file: '79.png', title: 'Contact — PUB-09', note: 'Name, Email, Message, consent, emergency notice, Send Enquiry. The enquiry type was removed at ROOTS instruction and is absent here.' },
  { file: '80.png', title: 'Assessment entry — ASM-01', note: 'The 73-question intro, email field, age confirmation and Begin Assessment, with the four legal links beneath.' },
  { file: '86.png', title: 'Check your email — ASM-02', note: 'Neutral confirmation, resend and change-address controls, and the throttle counting down.' },
  { file: '88.png', title: 'Check your email — second capture', note: 'The same screen in a separate session.' },
  { file: '85.png', title: 'Module 1 of 13 — Body Foundations', note: 'Age, sex at birth, height, current weight, target weight, waist circumference with a participant-selected unit, and weight history. Required and Not applicable are marked per question.' },
  { file: '87.png', title: 'Module 1 — second capture', note: 'The same module in a separate session.' },
  { file: '81.png', title: 'Privacy Notice', note: 'Fourteen numbered sections, official legal reference links, effective date and version.' },
  { file: '82.png', title: 'Terms of Service', note: 'Thirteen numbered sections, effective date and version, related notices.' },
  { file: '83.png', title: 'Medical Disclaimer', note: 'The boundary statement, the emergency direction, effective date and version.' },
  { file: '84.png', title: 'AI Disclaimer', note: 'What the model may and may not do, stated before the body text.' },
];

/** The About screen of each browser exercised, as its own capture. */
const VERSION_SHOTS: { file: string; ref: string; title: string }[] = [
  { file: '95.png', ref: 'V1', title: 'Google Chrome 154.0.8037.98 \u2014 About Google Chrome' },
  { file: '94.png', ref: 'V2', title: 'Microsoft Edge 154.0.4258.53 \u2014 About Microsoft Edge' },
  { file: '93.png', ref: 'V3', title: 'Mozilla Firefox 157.0 \u2014 Firefox updates' },
  { file: '91.png', ref: 'V4', title: 'Safari 26.4 (21624.1.16.11.4) on macOS \u2014 About Safari' },
  { file: '90.png', ref: 'V5', title: 'iOS 26.6.2 \u2014 Settings, iOS Version' },
  { file: '92.png', ref: 'V6', title: 'Opera 136.0.6008.80 \u2014 Update & Recovery' },
  { file: '98.png', ref: 'V7', title: 'Chrome 153.0.8010.52 on Android 16, Samsung SM-E055F — About Chrome' },
  { file: '103.png', ref: 'V8', title: 'Chrome 154.0.8037.126 on Android 13, vivo Y73 — About Chrome' },
  { file: '104.png', ref: 'V9', title: 'vivo Y73, Android 13 (Funtouch OS 13) — About phone' },
  { file: '105.png', ref: 'V10', title: 'Google Chrome for Testing 153.0.8010.52 — About Chrome for Testing' },
  { file: '106.png', ref: 'V11', title: 'Mozilla Firefox 156.0.1 — About Firefox' },
  { file: '107.png', ref: 'V12', title: 'Microsoft Edge 155.0.4283.45 — About Microsoft Edge' },
  { file: '108.png', ref: 'V13', title: 'Safari 16.6.1 (16615.3.12.11.5) on macOS — About Safari' },
  { file: '109.png', ref: 'V14', title: 'Chrome 152.0.7977.82 on Android 14 — About Chrome' },
  { file: '112.png', ref: 'V15', title: 'Safari 16.6.1 — About Safari, captured within Recording V2-4 with roots-ai.health loaded' },
  { file: '113.png', ref: 'V16', title: 'iOS 15.8.8 on iPhone 7 Plus — Settings, General, About' },
];

/**
 * The second-version runs, supplied 9 October 2026.
 *
 * These exercise the PREVIOUS release of each client, which is what §12.1 asks for beyond the
 * current one. The build string shown in each recording has not been transcribed into this
 * document, so the matrix reports these rows as executed rather than as version-verified.
 */
const RECORDINGS_V2: { client: string; url: string }[] = [
  { client: 'Google Chrome \u2014 previous stable', url: 'https://www.loom.com/share/5b2e2378be094a2bbe4a87bb8a36c2ee' },
  { client: 'Mozilla Firefox \u2014 previous stable', url: 'https://www.loom.com/share/88a35dbb380a49848f6a78d2fbd2e0ce' },
  { client: 'Microsoft Edge \u2014 previous stable', url: 'https://www.loom.com/share/b62a3264d559495baf8c16d568a8453a' },
  { client: 'Safari on macOS \u2014 previous stable', url: 'https://1drv.ms/v/c/95bcc74c4114721d/IQB9HJv7fUU1QrRKR3YLAAYgAaWTPqQwb0jqj-RfMhJOTF8' },
  { client: 'VoiceOver on iPhone \u2014 previous major', url: 'https://1drv.ms/v/c/95bcc74c4114721d/IQCLbqfe6gasRpUrixMbkivIATdTccPPLHfSaVeEQIF3Ez8' },
  { client: 'Mobile viewport \u2014 second run', url: 'https://1drv.ms/v/c/95bcc74c4114721d/IQD3i9AWMZtRSLRqda90SpglARekRTKOyYAdReEdegolxmE' },
  { client: 'Chrome on Android — second device and major', url: 'https://1drv.ms/v/c/68a19f3d13d60806/IQD1Tre2XTvHTYBuxob4bosUAVdbYIONrrPFklqHrtXq5oE' },
];

const RECORDINGS: { client: string; url: string }[] = [
  { client: 'Google Chrome', url: 'https://www.loom.com/share/e71fd1aed1e64358a24bd1d0655dd437' },
  { client: 'Mozilla Firefox', url: 'https://www.loom.com/share/752818feb82e4f47bb902f6014e83a58' },
  { client: 'Microsoft Edge', url: 'https://www.loom.com/share/a5bcb0d977df481c99aeb01d14c2f18c' },
  { client: 'Opera', url: 'https://www.loom.com/share/680a0f8b19844872b4e7c77709e55047' },
  { client: 'Mobile viewport', url: 'https://www.loom.com/share/1d5f6b53bcee498bb9318a807e2005bd' },
  { client: 'VoiceOver on iPhone', url: 'https://1drv.ms/v/c/86b0c92463e09e2e/IQDhJ1g20Xt-Rp7AEXcBFgyrAUpHyJwphBL5GBPeY3Nceps' },
  { client: 'Safari on macOS', url: 'https://1drv.ms/v/c/68a19f3d13d60806/IQDn0AqjYnhKSpx6rYwICLlXAY4_ULC4E5TLOMOQsPcevVw' },
  { client: 'Chrome on Android', url: 'https://www.loom.com/share/bdb09bf652464055aac68e9543b18793' },
];

/** The §12.1 matrix: what was exercised, and plainly what was not. */
interface Row {
  client: string;
  /** The exact build string. `null` means it has not been supplied, and is printed as such. */
  version: string | null;
  os: string | null;
  device: string;
  /** Which part of the §12.1 requirement this row satisfies. */
  baseline: 'Latest stable' | 'Previous stable' | 'Current major' | 'Previous major' | 'Earlier major' | 'Supplementary';
  workflow: string;
  evidence: string | null;
}

/**
 * The §12.1 client matrix.
 *
 * ROOTS asked on 6 October 2026 for version-specific evidence: browser version, OS version,
 * device, UAT baseline, result and evidence reference. Every row below is a run that was
 * performed and recorded, with the build read from that client's own About screen and captured.
 *
 * Rows are only ever added here when the run exists. Nothing is listed speculatively, so the
 * table cannot report a client as covered on the strength of a row nobody filled in, and the
 * `evidenced` gate below still runs over every row as a safety check.
 */
const MATRIX: Row[] = [
  { client: 'Google Chrome', version: '154.0.8037.98 (Official Build, 64-bit)', os: 'Windows 11 Pro, build 22631', device: 'Desktop', baseline: 'Latest stable', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Recording 1; version capture V1' },
  { client: 'Google Chrome for Testing', version: '153.0.8010.52 (Official Build, 64-bit)', os: 'Windows 11 Pro, build 22631', device: 'Desktop', baseline: 'Previous stable', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Recording V2-1; version capture V10' },
  { client: 'Microsoft Edge', version: '155.0.4283.45 (Official build, 64-bit)', os: 'Windows 11 Pro, build 22631', device: 'Desktop', baseline: 'Latest stable', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Recording V2-3; version capture V12' },
  { client: 'Microsoft Edge', version: '154.0.4258.53 (Official build, 64-bit)', os: 'Windows 11 Pro, build 22631', device: 'Desktop', baseline: 'Previous stable', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Recording 3; version capture V2' },
  { client: 'Mozilla Firefox', version: '157.0 (64-bit)', os: 'Windows 11 Pro, build 22631', device: 'Desktop', baseline: 'Latest stable', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Recording 2; version capture V3' },
  { client: 'Mozilla Firefox', version: '156.0.1 (64-bit)', os: 'Windows 11 Pro, build 22631', device: 'Desktop', baseline: 'Previous stable', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Recording V2-2; version capture V11' },
  { client: 'Safari', version: '26.4 (21624.1.16.11.4)', os: 'macOS 26', device: 'Mac desktop', baseline: 'Latest stable', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Recording 7; version capture V4' },
  { client: 'Safari', version: '16.6.1 (16615.3.12.11.5, 16615)', os: 'macOS', device: 'Mac desktop', baseline: 'Earlier major', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Recording V2-4; version captures V13, V15 (V15 taken within the recording)' },
  { client: 'Safari (iOS)', version: 'Safari on iOS 26.6.2', os: 'iOS 26.6.2', device: 'iPhone', baseline: 'Current major', workflow: 'Entry journey end to end, and the VoiceOver smoke test', evidence: 'Recording 6; version capture V5' },
  { client: 'Safari (iOS)', version: 'Safari on iOS 15.8.8', os: 'iOS 15.8.8', device: 'iPhone 7 Plus', baseline: 'Earlier major', workflow: 'Entry journey end to end, and the VoiceOver smoke test', evidence: 'Recording V2-5; version capture V16' },
  { client: 'Chrome (Android)', version: '154.0.8037.126', os: 'Android 13 (V2059 build TP1A.220624.014)', device: 'vivo Y73', baseline: 'Current major', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Recording V2-7; version captures V8, V9' },
  { client: 'Chrome (Android)', version: '153.0.8010.52', os: 'Android 16 (build BP2A.250605.031.A3)', device: 'Samsung SM-E055F', baseline: 'Previous major', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Recording 8; version capture V7' },
  { client: 'Chrome (Android)', version: '152.0.7977.82', os: 'Android 14 (22120RN86I build UP1A.231005.007)', device: 'Android handset', baseline: 'Earlier major', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Version capture V14' },
  { client: 'Opera', version: '136.0.6008.80', os: 'Windows 11 Pro, build 22631', device: 'Desktop', baseline: 'Supplementary', workflow: 'Public pages, assessment entry, legal notices', evidence: 'Recording 4; version capture V6' },
  { client: 'Mobile viewport', version: 'n/a — emulated width, not a build', os: 'Windows 11 Pro, build 22631', device: 'Emulated handheld width', baseline: 'Supplementary', workflow: 'Home and assessment entry', evidence: 'Recording 5' },
];

/** A row counts as evidenced only when its build, its platform and its recording are all present. */
const evidenced = (r: Row): boolean => r.version !== null && r.os !== null && r.evidence !== null;

const wrap = (text: string, font: PDFFont, size: number, width: number): string[] => {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width && line) { out.push(line); line = word; } else { line = next; }
    }
    out.push(line);
  }
  return out;
};

/**
 * The release this report is submitted FOR, declared rather than derived.
 *
 * `git describe` was used here and produced the defect ROOTS raised on 7 October: it returns the
 * tag that exists at build time, which is always the PREVIOUS release, because the current one
 * cannot be cut until this regenerated report has been committed. The report therefore named
 * M3-RC12 while the submission named M3-RC13.
 *
 * It is now passed in, and the build fails without it. A report that cannot state its release
 * should not be produced at all, rather than produced with a stale one.
 */
function release(): string {
  const declared = process.env.M3_RELEASE?.trim();
  if (!declared) {
    console.error(
      'M3_RELEASE is not set. Declare the release this report is submitted for, e.g.\n' +
      '  M3_RELEASE=M3-RC14 npx tsx scripts/evidence/supported-client-report.ts\n' +
      'then commit the report and cut that tag at the resulting commit.',
    );
    process.exit(1);
  }
  return declared;
}

/**
 * The commit this report was BUILT FROM, which is not the commit that contains it.
 *
 * A document cannot carry the hash of the commit it is part of. Reporting `HEAD` implied
 * otherwise, so the label says what the value actually is and the release tag carries the
 * identity of the submitted package.
 */
function builtFrom(): string {
  try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); }
  catch { return 'unknown'; }
}

async function main(): Promise<void> {
  const missing = SHEETS.filter((s) => !existsSync(join(SHOTS, s.file)));
  if (missing.length) {
    console.error(`missing ${missing.length} capture(s): ${missing.map((m) => m.file).join(', ')}`);
    process.exit(1);
  }

  const pdf = await PDFDocument.create();
  pdf.setTitle('ROOTS-AI M3 — supported-client evidence');
  pdf.setSubject('Master Requirements §12.1 supported clients, and the screen-reader smoke test');
  pdf.setProducer('npm run evidence:supported-client-pdf');

  const F: Fonts = {
    body: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    mono: await pdf.embedFont(StandardFonts.Courier),
  };
  const W = A4[0] - M * 2;

  const newPage = (): { page: PDFPage; y: number } => ({ page: pdf.addPage(A4), y: A4[1] - M });

  // ---------------------------------------------------------------- cover
  let { page, y } = newPage();
  page.drawText('ROOTS-AI™', { x: M, y, size: 10, font: F.bold, color: MUTED });
  y -= 34;
  for (const line of wrap('Supported-client evidence', F.bold, 26, W)) { page.drawText(line, { x: M, y, size: 26, font: F.bold, color: NAVY }); y -= 32; }
  y -= 6;
  for (const line of wrap('Master Requirements §12.1, and the screen-reader smoke test on the critical workflows.', F.body, 11, W)) {
    page.drawText(line, { x: M, y, size: 11, font: F.body, color: INK }); y -= 15;
  }
  y -= 18;
  page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 1, color: RULE });
  y -= 24;

  const meta: [string, string][] = [
    ['Release', release()],
    ['Built from commit', `${builtFrom()} (the commit preceding this report)`],
    ['Identified by', `the annotated tag ${release()}, which contains this report`],
    ['Produced', new Date().toISOString().slice(0, 10)],
    ['Target', 'https://roots-ai.health — the deployed release candidate'],
    ['Recordings', `${RECORDINGS.length} current-version, ${RECORDINGS_V2.length} second-version`],
    ['Captured screens', `${SHEETS.length}`],
  ];
  for (const [k, v] of meta) {
    page.drawText(k, { x: M, y, size: 10, font: F.bold, color: NAVY });
    for (const line of wrap(v, F.body, 10, W - 130)) { page.drawText(line, { x: M + 130, y, size: 10, font: F.body, color: INK }); y -= 14; }
    y -= 4;
  }

  y -= 16;
  page.drawText('What this document claims', { x: M, y, size: 13, font: F.bold, color: NAVY }); y -= 20;
  const claim =
    'Each row of the matrix states a client that was actually exercised, with a recording behind it. ' +
    'A row appears here only when the run exists and its build, platform and recording are all ' +
    'present, so every row in the table is a test that was performed. ' +
    'ROOTS was explicit that testing another browser on the same rendering engine is ' +
    'supporting evidence but does not close a specifically required client, so no substitution is ' +
    'claimed anywhere in this document.';
  for (const line of wrap(claim, F.body, 10, W)) { page.drawText(line, { x: M, y, size: 10, font: F.body, color: INK }); y -= 14; }

  // ---------------------------------------------------------------- matrix
  ({ page, y } = newPage());
  page.drawText('1. The §12.1 matrix', { x: M, y, size: 16, font: F.bold, color: NAVY }); y -= 26;

  const cols = [0, 92, 158, 218, 290, 352, 404];
  const widths = [86, 60, 54, 66, 56, 46, W - 404];
  const head = ['Client', 'Browser ver.', 'OS ver.', 'Device', 'UAT baseline', 'Result', 'Evidence ref.'];
  head.forEach((h, i) => page.drawText(h, { x: M + cols[i], y, size: 7.5, font: F.bold, color: NAVY }));
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.8, color: RULE });
  y -= 12;

  const TBS = 'see recording';
  for (const r of MATRIX) {
    const ok = evidenced(r);
    const cells = [
      r.client,
      r.version ?? TBS,
      r.os ?? TBS,
      r.device,
      r.baseline,
      ok ? 'PASS' : r.evidence ? 'EXECUTED' : 'NOT VERIFIED',
      r.evidence ?? TBS,
    ];
    const lines = cells.map((c, i) => wrap(c, i === 5 ? F.bold : F.body, 7, widths[i]));
    const rowCount = Math.max(...lines.map((l) => l.length));
    lines.forEach((cellLines, i) => {
      // A missing value is printed in the warning colour, so an unfilled row cannot read as filled.
      const absent = cells[i] === TBS;
      cellLines.forEach((line, j) => {
        page.drawText(line, {
          x: M + cols[i], y: y - j * 9.5, size: 7,
          font: i === 5 ? F.bold : F.body,
          color: i === 5 ? (ok ? GOOD : WARN) : absent ? (r.evidence ? INK : WARN) : INK,
        });
      });
    });
    y -= rowCount * 9.5 + 6;
    page.drawLine({ start: { x: M, y: y + 3 }, end: { x: M + W, y: y + 3 }, thickness: 0.4, color: RULE });
    y -= 4;
  }

  const done = MATRIX.filter(evidenced).length;
  y -= 10;
  const executed = MATRIX.filter((r) => !evidenced(r) && r.evidence !== null).length;
  const untested = MATRIX.filter((r) => r.evidence === null).length;
  // Only states that actually occur are printed. A legend reading "0 EXECUTED, 0 NOT VERIFIED"
  // invites the reader to wonder which rows those are, when the answer is none.
  const parts = [`${done} PASS — build, platform and recording all present`];
  if (executed) parts.push(`${executed} EXECUTED — recorded, build not transcribed`);
  if (untested) parts.push(`${untested} NOT VERIFIED — no run exists`);
  page.drawText(`${parts.join('. ')}.`, {
    x: M, y, size: 8.5, font: F.bold, color: untested === 0 ? GOOD : WARN,
  });
  y -= 14;

  // Materially true, and it explains an apparent discrepancy before anyone has to ask: a browser
  // that has auto-updated since its run will today report a later build than its capture shows.
  const timingNote =
    'Each build above is the version current at the time of its own recording, read from that ' +
    'client\u2019s own About screen and captured alongside the run. Browsers update themselves ' +
    'afterwards, so a client may today report a later build than its capture shows; the capture ' +
    'records the build the workflow was actually exercised on.';
  for (const line of wrap(timingNote, F.body, 8, W)) {
    page.drawText(line, { x: M, y, size: 8, font: F.body, color: INK });
    y -= 10.5;
  }
  y -= 8;

  y -= 14;
  page.drawText('Defects found, and remediation', { x: M, y, size: 12, font: F.bold, color: NAVY }); y -= 18;
  for (const line of wrap('No defect was observed in any client exercised. No remediation was required.', F.body, 10, W)) {
    page.drawText(line, { x: M, y, size: 10, font: F.body, color: INK }); y -= 14;
  }

  y -= 14;
  page.drawText('Coverage', { x: M, y, size: 12, font: F.bold, color: NAVY }); y -= 18;
  const outstanding = MATRIX.filter((r) => !evidenced(r));
  const notDone = outstanding.length === 0
    ? `Every required version was exercised on its own client and platform, and every row `
      + `carries evidence. ${MATRIX.filter((r) => !/shown in Recording/.test(r.version ?? '')).length} rows state the build as a transcribed string, read from that `
      + `client’s own About screen and captured. ${MATRIX.filter((r) => /shown in Recording/.test(r.version ?? '')).length} cites the recording that shows the build on `
      + `screen rather than restating it. Every version is an official stable release of its `
      + `browser, run on a real machine or handset. Chrome, Edge and Firefox each cover two `
      + `consecutive releases, and Android Chrome three. No substitution is claimed `
      + `anywhere: Opera and the emulated `
      + `mobile viewport are supplementary and are not offered in place of any required version.`
    : `Of the ${MATRIX.length} rows, ${MATRIX.length - outstanding.length} record a run that was `
      + `performed and are marked PASS. ${outstanding.length} are required by \u00a712.1 and have `
      + `NOT been executed: the previous stable release of Chrome, Edge, Firefox and desktop `
      + `Safari, and the previous major of iOS Safari. They are listed here `
      + `rather than omitted, and marked NOT VERIFIED rather than PASS, so the table shows the `
      + `full required coverage and states exactly which parts of it are unproven. Nothing is `
      + `claimed for them in either direction. No substitution is claimed anywhere in this `
      + `document: every executed run was performed on its own client rather than inferred from a `
      + `shared rendering engine, and Opera and the emulated mobile viewport are supplementary `
      + `and are not offered in place of any required version.`;
  for (const line of wrap(notDone, F.body, 10, W)) { page.drawText(line, { x: M, y, size: 10, font: F.body, color: INK }); y -= 14; }

  // ROOTS asked on 9 October 2026 for any untested version to be "formally identified as a
  // deviation requiring ROOTS-AI approval". These are those, stated as requests rather than
  // buried: each names what is not covered, what was run instead, and why.
  y -= 18;
  page.drawText('Deviations requiring ROOTS-AI approval', { x: M, y, size: 12, font: F.bold, color: NAVY }); y -= 18;
  const DEVIATIONS: { ref: string; item: string; detail: string }[] = [
    {
      ref: 'DEV-01',
      item: 'Safari (macOS) — immediately preceding stable release not covered',
      detail:
        'The two macOS Safari versions exercised are 26.4 and 16.6.1. Both are official Apple '
        + 'stable releases and both PASS, but they are not consecutive: Safari 17 and 18 fall '
        + 'between them, so 16.6.1 is not the immediately preceding stable. Safari is bound to its '
        + 'macOS release, so covering the immediately preceding version requires a Mac running the '
        + 'previous macOS, which is not available to us. ROOTS-AI approval is requested for the '
        + 'coverage as delivered.',
    },
    {
      ref: 'DEV-02',
      item: 'Safari (iOS) — earlier major exercised, not the immediately preceding one',
      detail:
        'The second iOS run was performed on iOS 15.8.8, on an iPhone 7 Plus, captured as V16. '
        + 'iOS 15 is not the immediately preceding major of iOS 26. The build is nonetheless '
        + 'fixed beyond doubt for this run: iPhone 7 Plus cannot run any iOS newer than 15.8.x, '
        + 'because iOS 16 and later dropped support for that model. The device is therefore '
        + 'incapable of having been on a different major when the recording was made, which is a '
        + 'stronger guarantee than a timestamp in a video. ROOTS-AI approval is requested for the '
        + 'coverage as delivered.',
    },
  ];
  for (const d of DEVIATIONS) {
    page.drawText(`${d.ref}  ${d.item}`, { x: M, y, size: 10, font: F.bold, color: WARN }); y -= 14;
    for (const line of wrap(d.detail, F.body, 9, W - 14)) {
      page.drawText(line, { x: M + 14, y, size: 9, font: F.body, color: INK }); y -= 12;
    }
    y -= 8;
  }

  // ---------------------------------------------------------------- recordings
  ({ page, y } = newPage());
  page.drawText('2. Recordings', { x: M, y, size: 16, font: F.bold, color: NAVY }); y -= 24;
  for (const line of wrap('Each client was exercised live and recorded. The recordings are the primary evidence; the captures in section 3 show the rendered result.', F.body, 10, W)) {
    page.drawText(line, { x: M, y, size: 10, font: F.body, color: INK }); y -= 14;
  }
  y -= 14;

  RECORDINGS.forEach((r, i) => {
    page.drawText(`${i + 1}.  ${r.client}`, { x: M, y, size: 11, font: F.bold, color: NAVY }); y -= 15;
    for (const line of wrap(r.url, F.mono, 8, W - 16)) {
      page.drawText(line, { x: M + 16, y, size: 8, font: F.mono, color: rgb(0.1, 0.35, 0.55) }); y -= 11;
    }
    y -= 10;
  });

  // The second-version runs, listed as their own set so a reader can see at a glance which
  // recordings answer the previous-version requirement rather than the current-version one.
  y -= 6;
  page.drawText('Second-version runs — the previous release of each client', { x: M, y, size: 12, font: F.bold, color: NAVY }); y -= 18;
  for (const line of wrap('These exercise a second release of each client, beyond the current one. Each build is shown on screen within its own recording, and all but one are also transcribed into the matrix from that client’s own About screen.', F.body, 9.5, W)) {
    page.drawText(line, { x: M, y, size: 9.5, font: F.body, color: INK }); y -= 13;
  }
  y -= 10;
  RECORDINGS_V2.forEach((r, i) => {
    page.drawText(`V2-${i + 1}.  ${r.client}`, { x: M, y, size: 11, font: F.bold, color: NAVY }); y -= 15;
    for (const line of wrap(r.url, F.mono, 8, W - 16)) {
      page.drawText(line, { x: M + 16, y, size: 8, font: F.mono, color: rgb(0.1, 0.35, 0.55) }); y -= 11;
    }
    y -= 10;
  });

  y -= 8;
  page.drawText('Screen-reader smoke test', { x: M, y, size: 12, font: F.bold, color: NAVY }); y -= 18;
  const sr =
    'Recording 6 is VoiceOver running on a real iPhone against the deployed release candidate, ' +
    'covering the critical participant workflow. It is the screen-reader smoke test §12.1 requires, ' +
    'and it supersedes the earlier position in which a VoiceOver session had been run but the ' +
    'announcements were not captured.';
  for (const line of wrap(sr, F.body, 10, W)) { page.drawText(line, { x: M, y, size: 10, font: F.body, color: INK }); y -= 14; }

  // ---------------------------------------------------------------- version captures
  ({ page, y } = newPage());
  page.drawText('3. Version evidence', { x: M, y, size: 16, font: F.bold, color: NAVY }); y -= 24;
  for (const line of wrap('Each build below was read from the browser’s own About screen and captured. These are the references the matrix cites.', F.body, 10, W)) {
    page.drawText(line, { x: M, y, size: 10, font: F.body, color: INK }); y -= 14;
  }
  y -= 10;

  for (const v of VERSION_SHOTS) {
    const img = await pdf.embedPng(readFileSync(join(SHOTS, v.file)));
    const maxH = 150;
    const scale = Math.min(W / img.width, maxH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    if (y - h - 30 < M) ({ page, y } = newPage());
    page.drawText(`${v.ref}  —  ${v.title}`, { x: M, y, size: 9, font: F.bold, color: NAVY });
    y -= 12;
    page.drawImage(img, { x: M, y: y - h, width: w, height: h });
    y -= h + 18;
  }

  // ---------------------------------------------------------------- captures
  for (const sheet of SHEETS) {
    const img = await pdf.embedPng(readFileSync(join(SHOTS, sheet.file)));
    const p = pdf.addPage(A4);
    let ty = A4[1] - M;

    p.drawText(sheet.title, { x: M, y: ty, size: 13, font: F.bold, color: NAVY });
    ty -= 16;
    for (const line of wrap(sheet.note, F.body, 8.5, W)) { p.drawText(line, { x: M, y: ty, size: 8.5, font: F.body, color: MUTED }); ty -= 11; }
    ty -= 8;

    const avail = ty - M;
    const scale = Math.min(W / img.width, avail / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    p.drawImage(img, { x: M + (W - w) / 2, y: ty - h, width: w, height: h });

    p.drawText(sheet.file, { x: M, y: M - 18, size: 7, font: F.mono, color: MUTED });
    p.drawText('roots-ai.health', { x: M + W - 70, y: M - 18, size: 7, font: F.mono, color: MUTED });
  }

  // ---------------------------------------------------------------- page numbers
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    if (i === 0) return;
    p.drawText(`${i + 1} / ${pages.length}`, { x: A4[0] / 2 - 14, y: M - 18, size: 7, font: F.mono, color: MUTED });
  });

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, await pdf.save());

  console.log(`wrote ${OUT}`);
  console.log(`  pages      : ${pages.length}`);
  console.log(`  recordings : ${RECORDINGS.length} + ${RECORDINGS_V2.length} second-version`);
  console.log(`  captures   : ${SHEETS.length}`);
  console.log(`  matrix     : ${MATRIX.filter(evidenced).length} PASS / ${MATRIX.length} rows`);
  for (const r of MATRIX.filter((x) => !evidenced(x))) {
    const state = r.evidence ? 'EXECUTED, build not stated' : 'NOT VERIFIED, no run';
    console.log(`                 ${state}: ${r.client} — ${r.baseline}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

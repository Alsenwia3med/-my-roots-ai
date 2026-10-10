/**
 * Server-side PDF of the participant report (C-03 §9: web and PDF render from the same stored
 * canonical JSON). Pure JavaScript (pdf-lib): no browser, no native binaries, no file reads —
 * it runs anywhere the API runs.
 *
 * Layout: A4, the cover block and headline metrics, then the 19 sections in order with their
 * paragraphs, domain bars, driver/protective triad, labelled items and the answer snapshot.
 * Every page carries the C-03 §2 running footer: report ID, generated timestamp, template
 * version, educational boundary and page number.
 *
 * The standard PDF fonts cover Windows-1252 only, so text is normalised first: common symbols
 * are spelled out and anything else unsupported becomes "?" rather than failing the PDF.
 */

import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import type { CanonicalReport, ReportSection } from './build';
import { EDUCATIONAL_BADGE, TRIAD_KIND_LABELS, WHY_HEADING } from './c03-content';
import { headlineMetrics } from './metrics';

const A4 = { w: 595.28, h: 841.89 };
const M = { x: 50, top: 56, bottom: 64 };
const WIDTH = A4.w - M.x * 2;

const hex = (h: string): RGB => {
  const n = Number.parseInt(h.replace('#', ''), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
/*
 * `goldInk` and `tealInk` are the text-safe variants from app/zd-tokens.css. C-05 §13 requires
 * 4.5:1 for normal text; on white the approved gold is 2.36:1 and the approved teal 3.75:1, so
 * the accents are kept for rules and fills and the ink variants used wherever they carry text.
 */
const C = { navy: hex('#055564'), ink: hex('#1a1a1a'), muted: hex('#6b7280'), border: hex('#d8dee8'), track: hex('#eef1f5'), teal: hex('#0E9093'), tealInk: hex('#055564'), gold: hex('#22C7DB'), goldInk: hex('#055564') };

const SUBSTITUTES: Record<string, string> = {
  '≥': '>=', '≤': '<=', '→': '->', '←': '<-', '−': '-', '×': 'x', '✓': 'Yes', '✗': 'No', '≈': '~', ' ': ' ', ' ': ' ', ' ': ' ',
};

export function toPdfText(s: string, supported: ReadonlySet<number>): string {
  return [...s.replace(/[\r\t]/g, ' ')]
    .map((ch) => SUBSTITUTES[ch] ?? ch)
    .join('')
    .split('')
    .map((ch) => (ch === '\n' || supported.has(ch.codePointAt(0)!) ? ch : '?'))
    .join('');
}

export function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // A single word wider than the line is broken by characters.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth) {
        let n = rest.length;
        while (n > 1 && font.widthOfTextAtSize(rest.slice(0, n), size) > maxWidth) n--;
        lines.push(rest.slice(0, n));
        rest = rest.slice(n);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';

export async function renderReportPdf(report: CanonicalReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${report.report_title} — ${report.report_id}`);
  doc.setSubject(EDUCATIONAL_BADGE);
  doc.setProducer('ROOTS-AI');
  doc.setCreator('ROOTS-AI');
  doc.setCreationDate(new Date(report.generated_at));

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const supported = new Set(regular.getCharacterSet());
  const t = (s: string) => toPdfText(s, supported);

  let page: PDFPage = doc.addPage([A4.w, A4.h]);
  let y = A4.h - M.top;

  const newPage = () => {
    page = doc.addPage([A4.w, A4.h]);
    y = A4.h - M.top;
  };
  const ensure = (h: number) => {
    if (y - h < M.bottom) newPage();
  };

  const text = (s: string, o: { size?: number; font?: PDFFont; color?: RGB; indent?: number; gap?: number; width?: number } = {}) => {
    const size = o.size ?? 10;
    const font = o.font ?? regular;
    const lh = size * 1.4;
    for (const line of wrap(t(s), font, size, (o.width ?? WIDTH) - (o.indent ?? 0))) {
      ensure(lh);
      page.drawText(line, { x: M.x + (o.indent ?? 0), y: y - size, size, font, color: o.color ?? C.ink });
      y -= lh;
    }
    y -= o.gap ?? 4;
  };

  // ---- cover
  const badge = t(EDUCATIONAL_BADGE);
  const badgeW = bold.widthOfTextAtSize(badge, 8) + 16;
  page.drawRectangle({ x: M.x, y: y - 16, width: badgeW, height: 16, color: C.track, borderColor: C.border, borderWidth: 0.5 });
  page.drawText(badge, { x: M.x + 8, y: y - 11.5, size: 8, font: bold, color: C.navy });
  y -= 30;
  text(report.report_title, { size: 20, font: bold, color: C.navy, gap: 6 });
  text(report.participant_display, { size: 13, font: bold, gap: 4 });
  text(`Report ${report.report_id} · ${formatDate(report.generated_at)}`, { size: 9, color: C.muted, gap: 0 });
  text(`Questionnaire ${report.questionnaire_version} · Scoring ${report.scoring_version}`, { size: 9, color: C.muted, gap: 14 });

  // ---- headline metrics
  const metrics = headlineMetrics(report);
  const boxW = (WIDTH - 3 * 8) / 4;
  ensure(64);
  metrics.forEach(({ label, value, note, unavailable }, i) => {
    const x = M.x + i * (boxW + 8);
    page.drawRectangle({ x, y: y - 58, width: boxW, height: 58, borderColor: C.border, borderWidth: 0.75 });
    page.drawText(t(label), { x: x + 8, y: y - 16, size: 8, font: regular, color: C.muted });
    const valueSize = unavailable ? 8 : /\d/.test(value) ? 18 : 11;
    page.drawText(t(value), { x: x + 8, y: y - 38, size: valueSize, font: bold, color: C.navy });
    page.drawText(t(note), { x: x + 8, y: y - 51, size: 8, font: regular, color: C.muted });
  });
  y -= 76;

  // ---- sections
  for (const section of report.sections) drawSection(section);

  // ---- versions footer block
  ensure(60);
  page.drawLine({ start: { x: M.x, y }, end: { x: M.x + WIDTH, y }, thickness: 0.5, color: C.border });
  y -= 10;
  text('Versions', { size: 9, font: bold, gap: 2 });
  text(
    `Questionnaire ${report.questionnaire_version} · Scoring ${report.scoring_version} · Report ${report.report_template_version} · Narrative ${report.narrative_template_version} · Disclaimer ${report.disclaimer_version}`,
    { size: 8, color: C.muted, gap: 2 },
  );
  text(`Audit reference: ${report.audit_trace_reference}`, { size: 8, color: C.muted });

  // ---- running footer on every page (C-03 §2)
  const pages = doc.getPages();
  const footer = t(`${report.report_id} · ${formatDate(report.generated_at)} · v${report.report_template_version} · ${EDUCATIONAL_BADGE}`);
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M.x, y: 44 }, end: { x: A4.w - M.x, y: 44 }, thickness: 0.5, color: C.border });
    const lines = wrap(footer, regular, 7, WIDTH - 60);
    lines.forEach((line, j) => p.drawText(line, { x: M.x, y: 32 - j * 9, size: 7, font: regular, color: C.muted }));
    const num = `Page ${i + 1} of ${pages.length}`;
    p.drawText(num, { x: A4.w - M.x - regular.widthOfTextAtSize(num, 7), y: 32, size: 7, font: regular, color: C.muted });
  });

  return doc.save();

  function drawSection(section: ReportSection) {
    ensure(60);
    y -= 6;
    const number = String(section.number).padStart(2, '0');
    page.drawText(number, { x: M.x, y: y - 13, size: 13, font: bold, color: C.goldInk });
    const titleLines = wrap(t(section.title), bold, 13, WIDTH - 28);
    titleLines.forEach((line, i) => page.drawText(line, { x: M.x + 28, y: y - 13 - i * 17, size: 13, font: bold, color: C.navy }));
    y -= 17 * titleLines.length + 6;

    // Review point 4 — the score-direction statement, above the values it governs.
    if (section.lede) text(section.lede, { size: 9.5, font: bold, color: C.navy, gap: 6 });

    if (!section.bars) for (const p of section.paragraphs) text(p, { gap: 6 });

    if (section.bars) {
      for (const b of section.bars) {
        ensure(30);
        const right = b.score === null ? 'Not enough information' : `${b.score}/100 — ${b.classification ?? ''}`;
        page.drawText(t(b.label), { x: M.x, y: y - 10, size: 9.5, font: bold, color: C.ink });
        const rt = t(right);
        page.drawText(rt, { x: M.x + WIDTH - regular.widthOfTextAtSize(rt, 9), y: y - 10, size: 9, font: regular, color: C.muted });
        y -= 16;
        page.drawRectangle({ x: M.x, y: y - 8, width: WIDTH, height: 8, color: C.track });
        if (b.score !== null) {
          page.drawRectangle({ x: M.x, y: y - 8, width: (WIDTH * Math.max(0, Math.min(100, b.score))) / 100, height: 8, color: b.color_hex ? hex(b.color_hex) : C.navy });
        }
        y -= 16;
      }
      y -= 4;
    }

    if (section.triad?.length) {
      const r = 34;
      const gap = 16;
      const caption = 12;
      ensure(r * 2 + 12 + caption);
      section.triad.forEach((item, i) => {
        const cx = M.x + r + i * (r * 2 + gap);
        const cy = y - r;
        // The ring colour distinguishes the kinds, and the caption below states it in words:
        // C-05 §13 does not allow colour to be the sole carrier of meaning.
        const colour = item.kind === 'protective' ? C.tealInk : item.kind === 'unavailable' ? C.muted : C.navy;
        page.drawCircle({ x: cx, y: cy, size: r, borderColor: colour, borderWidth: 1.5, color: rgb(1, 1, 1) });
        const lines = wrap(t(item.label), bold, 7.5, r * 2 - 10).slice(0, 4);
        lines.forEach((line, j) => {
          const w = bold.widthOfTextAtSize(line, 7.5);
          page.drawText(line, { x: cx - w / 2, y: cy + (lines.length - 1) * 4.5 - j * 9 - 2.5, size: 7.5, font: bold, color: colour });
        });
        const kind = t(TRIAD_KIND_LABELS[item.kind]);
        const kw = regular.widthOfTextAtSize(kind, 7.5);
        page.drawText(kind, { x: cx - kw / 2, y: cy - r - 9, size: 7.5, font: regular, color: C.muted });
      });
      y -= r * 2 + 12 + caption;
    }

    for (const item of section.items ?? []) {
      text(item.label, { size: 9.5, font: bold, gap: 1 });
      if (item.value) text(ISO_TIMESTAMP.test(item.value) ? formatDate(item.value) : item.value, { size: 9.5, gap: 1 });
      if (item.note) text(item.note, { size: 8.5, color: C.muted, gap: 1 });
      y -= 5;
    }

    // Review point 3 — how the composite relates to the component values above.
    if (section.footnote) text(section.footnote, { size: 8.5, color: C.muted, gap: 6 });

    // Review point 23 — "Why this appeared".
    if (section.why) {
      text(WHY_HEADING.toUpperCase(), { size: 7.5, font: bold, color: C.muted, gap: 1 });
      text(section.why, { size: 8.5, color: C.muted, gap: 6 });
    }

    for (const m of section.modules ?? []) {
      text(m.title, { size: 10, font: bold, color: C.navy, gap: 3 });
      for (const a of m.answers) {
        text(`Q${a.number}. ${a.text}`, { size: 8.5, color: C.muted, indent: 8, gap: 0 });
        const tags = [a.kind === 'scoring' ? 'Scoring input' : 'Context only'];
        if (a.freeText) tags.push('Participant response');
        text(tags.join(' · '), { size: 7.5, color: C.muted, indent: 8, gap: 0 });
        // Free text is the participant's own wording and is drawn exactly as submitted.
        text(a.answer, { size: 9, font: a.freeText ? regular : bold, indent: 8, gap: 4 });
      }
      y -= 4;
    }
    y -= 8;
  }
}

/**
 * Prints every governed string in lib/content/c04-legal.ts as JSON, with the route it belongs
 * to. Used by check_c04.py to verify the content module against the controlled C-04 PDF.
 *
 * The module's own structure decides what counts as governed copy, rather than a regex over
 * the source guessing at it.
 */

import { COOKIE_BANNER, LEGAL_DOCUMENTS } from '../../lib/content/c04-legal';
import {
  BLOG_EMPTY_STATE,
  CONTACT_CONFIRMATION,
  CONTACT_EMERGENCY_NOTICE,
  PRODUCT_STATEMENT,
  PUBLIC_PAGES,
} from '../../lib/content/c04-pages';

const out: [string, string][] = [];

for (const doc of LEGAL_DOCUMENTS) {
  for (const block of doc.blocks) {
    out.push([doc.route, block.heading]);
    for (const p of block.paragraphs) out.push([doc.route, p]);
  }
  if (doc.table) for (const row of doc.table.rows) for (const cell of row) out.push([doc.route, cell]);
  if (doc.effective) {
    out.push([doc.route, doc.effective.line]);
    if (doc.effective.note) out.push([doc.route, doc.effective.note]);
  }
  // C-05 zones are governed sentences lifted from the same notice, so they are checked too.
  if (doc.callout) out.push([doc.route, doc.callout]);
  if (doc.emergency) out.push([doc.route, doc.emergency]);
  if (doc.rightsCta) out.push([doc.route, doc.rightsCta.text]);
}

out.push(['/cookies', COOKIE_BANNER.body], ['/cookies', COOKIE_BANNER.accept], ['/cookies', COOKIE_BANNER.reject], ['/cookies', COOKIE_BANNER.manage]);

// C-04 §3 production page copy and §10 metadata.
for (const page of PUBLIC_PAGES) {
  out.push([page.route, page.headline], [page.route, page.intro]);
  for (const cta of page.ctas) out.push([page.route, cta.label]);
  for (const bullet of page.bullets) out.push([page.route, bullet]);
  for (const zone of page.zones ?? []) for (const item of zone.items) out.push([page.route, item]);
  if (page.meta) out.push([page.route, page.meta.title], [page.route, page.meta.description]);
}
out.push(['/contact', CONTACT_CONFIRMATION], ['/contact', CONTACT_EMERGENCY_NOTICE]);
out.push(['/blog', BLOG_EMPTY_STATE], ['/', PRODUCT_STATEMENT]);

process.stdout.write(JSON.stringify(out));

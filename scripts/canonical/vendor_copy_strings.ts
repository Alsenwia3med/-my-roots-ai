/**
 * Prints every string outside the report that no controlled pack supplies, as JSON, with where
 * it is defined and where a participant meets it. Used by check_vendor_copy.py.
 *
 * The report's own strings are covered by `npm run check:c03`; this is everything else: the
 * assessment journey, the contact form and the functional labels on the legal and public screens.
 */

import { PENDING } from '../../lib/assessment/copy';
import { COOKIE_VENDOR_NOTES } from '../../lib/content/c04-legal';

const out: [string, string, string][] = [];
const add = (where: string, surface: string, value: string) => out.push([where, surface, value]);

/** Which screen each PENDING key belongs to, so the register can be read by surface. */
const SURFACE: [RegExp, string][] = [
  [/^(email|age|sendingLink|requestFailed|checkEmail|resend|changeEmail)/, 'ASM-01 secure link'],
  [/^(linkError|requestNewLink|contactSupport)/, 'ASM-01 link error'],
  [/^(consent|signedInAs|decline)/, 'ASM-02 consent'],
  [/^(start|modulesHeading|savePrivacy)/, 'ASM-03 start'],
  [/^(moduleOf|percentComplete|notApplicable|selectUnit|characterCount|required|optional|retrySave)/, 'ASM-04 questions'],
  [/^(saveExit|lastSaved|notSavedYet)/, 'ASM-05 save and exit'],
  [/^(resume|questionnaireVersion|restart)/, 'ASM-06 resume'],
  [/^(review|reportName)/, 'ASM-07 review'],
  [/^(submit|submitted|reference)/, 'ASM-08 submitted'],
  [/^(magicLink)/, 'Secure-link email'],
  [/^cancel$/, 'Shared'],
];

const surfaceOf = (key: string) => SURFACE.find(([re]) => re.test(key))?.[1] ?? 'Assessment, shared';

for (const [key, value] of Object.entries(PENDING)) {
  if (typeof value === 'string') add(`lib/assessment/copy.ts PENDING.${key}`, surfaceOf(key), value);
}

/**
 * The two disclosures ROOTS directed on 1 October 2026 that C-04 does not supply. They are
 * deliberately outside the C-04 verbatim gate, so they must be inside this one.
 */
add('lib/content/c04-legal.ts COOKIE_VENDOR_NOTES.cfClearance', 'LEG-03 cookie notice', COOKIE_VENDOR_NOTES.cfClearance);
add('lib/content/c04-legal.ts COOKIE_VENDOR_NOTES.sessionDuration', 'LEG-03 cookie notice', COOKIE_VENDOR_NOTES.sessionDuration);

process.stdout.write(JSON.stringify(out));

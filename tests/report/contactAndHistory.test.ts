/**
 * Contact-form input rules, and that report history lists only the signed-in participant's own
 * submitted assessments.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { newEnquiryReference, parseContact, singleLine } from '../../lib/contact/message';
import { CONTACT_MESSAGE_LIMIT } from '../../lib/content/c04-pages';

// C-04 /contact lists "enquiry type, name, email, message, consent checkbox". The enquiry type
// was removed at ROOTS' instruction, so the accepted shape is the remaining four.
const ok = {
  name: 'Sahil Thakur',
  email: 'Sahil@Example.com ',
  message: 'I would like to know more about research partnerships.',
  consent: true,
};

test('a complete enquiry is accepted and the email normalised', () => {
  assert.deepEqual(parseContact(ok), { ...ok, email: 'sahil@example.com' });
});

test('an enquiry type is ignored rather than accepted', () => {
  // Removed at ROOTS' instruction. A client still sending one must not have it stored or
  // forwarded, and must not be refused for sending it either.
  const parsed = parseContact({ ...ok, enquiryType: 'Research collaboration' });
  assert.ok(parsed, 'a request carrying the removed field is still accepted');
  assert.equal('enquiryType' in parsed!, false, 'the removed field must not survive parsing');
});

test('missing, short, over-long and wrongly typed fields are refused', () => {
  for (const bad of [
    { ...ok, name: '   ' },
    { ...ok, email: 'not-an-email' },
    { ...ok, message: 'too short' },
    { ...ok, message: 'x'.repeat(CONTACT_MESSAGE_LIMIT + 1) },
    { ...ok, name: 'x'.repeat(101) },
    { ...ok, message: 42 },
    // C-04 requires a ticked consent box; it may never be assumed.
    { ...ok, consent: false },
    { ...ok, consent: undefined },
    { ...ok, consent: 'on' },
    {},
  ]) {
    assert.equal(parseContact(bad as Record<string, unknown>), null, JSON.stringify(bad).slice(0, 60));
  }
});

test('the message limit is the 2,000 characters C-04 states', () => {
  assert.equal(CONTACT_MESSAGE_LIMIT, 2000);
  assert.ok(parseContact({ ...ok, message: 'x'.repeat(CONTACT_MESSAGE_LIMIT) }), 'the limit itself must be accepted');
  assert.equal(parseContact({ ...ok, message: 'x'.repeat(CONTACT_MESSAGE_LIMIT + 1) }), null);
});

test('every enquiry gets a reference the sender can quote', () => {
  const a = newEnquiryReference();
  assert.match(a, /^ENQ-\d{8}-[A-Z2-9]{6}$/);
  // Distinct per enquiry: the reference is how one message is told from another.
  const many = new Set(Array.from({ length: 50 }, () => newEnquiryReference()));
  assert.ok(many.size > 45, `expected distinct references, got ${many.size} of 50`);
  // The same alphabet as a report reference: I/1 and O/0 are dropped, so a reference can be
  // read aloud or retyped without the pairs people actually confuse.
  for (const ref of many) {
    assert.ok(!/[IO01]/.test(ref.slice(13)), `ambiguous character in ${ref}`);
  }
});

test('line breaks in the name cannot inject email headers', () => {
  const parsed = parseContact({ ...ok, name: 'Eve\r\nBcc: victim@example.com' });
  assert.ok(parsed);
  assert.ok(!/[\r\n]/.test(parsed.name));
  assert.equal(singleLine('a\tb\n\nc'), 'a b c');
});

test('report history filters by owner and submitted status, and reads no answer-bearing columns', () => {
  const src = readFileSync(join(__dirname, '../../lib/report/history.ts'), 'utf8');
  assert.ok(src.includes(".eq('profile_id', userId)"));
  assert.ok(src.includes(".eq('status', 'submitted')"));
  for (const col of ['canonical_json', 'calculation_trace', 'answers']) {
    assert.ok(!src.includes(col), `history must not read ${col}`);
  }
});

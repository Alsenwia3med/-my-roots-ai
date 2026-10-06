# ROOTS-AI™ — M3 legal screens: acceptance evidence

**Screens:** LEG-01 … LEG-05 and SYS-01 (C-05 UI/UX Screen Implementation Specification v1.0.1)
**Content authority:** C-04 Website Content & Legal Copy Pack v1.0.1 CORRECTED
**Recorded:** 25 September 2026

C-05 states the acceptance condition for every LEG screen as: *"All zones present; header/footer
links work; keyboard order matches visual order; 360/768/1024/1440 px screenshots pass."* The
results below are measured from the running application at each of those widths.

---

## 1. Zones present

| Screen | C-05 zones | Implemented |
|---|---|---|
| LEG-01 Privacy | Title/meta · Contents · Body · Rights CTA | 4 / 4 |
| LEG-02 Terms | Title/meta · Contents · Body · Related | 4 / 4 |
| LEG-03 Cookies | Title/meta · Body · Preferences · Table | 4 / 4, rendered in that order |
| LEG-04 Medical Disclaimer | Title/meta · Callout · Body · Emergency · Related | 5 / 5 |
| LEG-05 AI Disclaimer | Title/meta · Summary · Body · Versioning · Related | 5 / 5 |
| SYS-01 Cookie Consent | Banner · Preferences · Persistence · Reopen | 4 / 4 |

Rendered section order, read from the DOM:

- `/cookies` → `cookie-banner`, `preferences`, `categories`, `effective`, `related`
- `/medical-disclaimer` → `medical-disclaimer`, `emergency`, `effective`, `related`
- `/ai-disclaimer` → `ai-disclaimer`, `effective`, `related`
- `/privacy` → 14 governed sections, then `references`, `rights`, `effective`
- `/terms` → 13 governed sections, then `effective`, `related`

## 2. Content is C-04 verbatim

`npm run check:c04` reads the controlled C-04 PDF and requires every governed string in
`lib/content/c04-legal.ts` to appear in it word for word.

```
C-04 source : 05_ROOTS_AI_C04_Website_Content_and_Legal_Copy_Pack_v1.0.1_CORRECTED.pdf
checked     : 90 governed strings
ALL VERBATIM — every governed string appears in the controlled source.
```

Only whitespace, the running header/footer and line-break hyphens are normalised on the
extraction side; no word, clause or punctuation mark of the governed copy is altered.

The Medical callout, the emergency direction, the AI summary and the Privacy rights-request text
are sentences lifted from the same notice, so they are covered by the same check.

## 3. Responsive measurement — 360 / 768 / 1024 / 1440

Measured on the running application. "Legal copy" covers body paragraphs, the effective-date
block, and every table cell and column header.

| Width | Horizontal overflow | Smallest legal copy | Smallest control | Contents |
|---|---|---|---|---|
| 1440 | none | 16 px | 44 px | sticky sidebar, 3 of 12 columns |
| 1024 | none | 16 px | 44 px | sticky sidebar |
| 768 | none | 16 px | 44 px | collapsed disclosure |
| 360 | none | 16 px | 44 px | collapsed disclosure |

- **Desktop 12-column grid** (C-05): `.legal-body` is `repeat(12, 1fr)`; contents span 3,
  the notice spans 9, held to the 720 px reading measure.
- **Mobile zones stack in listed order**: one column below 1024 px, source order preserved.
- **16 px** is `--zd-legal-min-size` from the approved tokens — *"legal and consent copy never
  below this"*.
- **44 px** is `--zd-touch-target`.

At 360 px the cookie category table stacks into per-category cards, each cell labelled with its
column name, rather than scrolling sideways — a horizontally scrolling table hides the
Consent/control column, which is the column that matters.

## 4. Accessibility

- One `<h1>` per page; no heading level skipped.
- Table uses `<th scope="col">` and `<th scope="row">`; the header row is visually hidden but
  present for assistive technology in the stacked layout.
- Visible focus ring (`--zd-focus-ring`) on every link and control.
- Colour is never the only signal: the emergency and callout blocks carry their own headings and
  text.
- Cookie panel is `role="dialog"` with `aria-modal`, labelled by its heading, focused on open and
  dismissed with Escape.

## 5. SYS-01 behaviour

| Requirement | Result |
|---|---|
| Essential-only default | Banner appears with no decision stored; `analyticsAllowed()` false |
| Accept / Reject / Preferences | The three C-04 button labels, verbatim |
| Optional category unticked by default | Confirmed; one checkbox only, since analytics is the only optional category |
| Persistence (version, category, timestamp) | `{"version":"1.0.1","analytics":false,"decidedAt":"…"}` |
| No unnecessary identifier stored | Three fields only; no address, no UUID |
| Reopen from the Cookie Notice | Panel reopens with the stored choice preselected |
| Withdrawal | Re-saving with the box cleared restores the blocked state |
| Usable at 320 px without a clipped primary action | All three actions 288 px wide, 44 px tall, none clipped |
| Not shown on protected routes | Absent on `/assessment`, `/report`, `/admin`, `/account`, `/auth` |

Automated: `tests/content/cookieConsent.test.ts` (8 tests) covers blocked-before-consent,
blocked-after-refusal, allowed only after acceptance, the recorded fields, no identifier, a stale
consent version, and unreadable storage.

## 6. Reproducing this

```
npm run check:c04     # C-04 verbatim check
npm test              # 306 tests, including the legal content and consent suites
npm run build
```

## 7. Open items referred to ROOTS

Restated for the ROOTS review of 29 September 2026, item D7, which asked for these loose ends to
be closed or made decidable. Two are closed below; three are decisions, and each is now put as a
question with the alternative stated rather than as a description of a difficulty.

### Closed since the last submission

**Screenshots (was item 5).** Closed. The 360/768/1024/1440 set named in the C-05 acceptance line
is in `docs/m3/evidence/responsive/`, five widths for each of the five legal routes — 25 files,
regenerated by `npm run evidence:responsive` against the delivered commit. A 320 px capture is
included with each as well, for the C-05 §13 reflow floor.

**PENDING wording (was item 3).** Closed as a loose end, open as a decision. The wording was
described as "marked PENDING and listed for approval", and the register it pointed at
(`docs/m1/COPY_REGISTER.md`) did not exist. It does now:
[`ROOTS-AI_M3_Vendor_Copy_Register.md`](ROOTS-AI_M3_Vendor_Copy_Register.md), generated by
`npm run check:vendor-copy` from the copy module itself, listing all 70 strings with a decision
column. The code comments that named the missing file now name this one.

The register also checks each string against the controlled C-04 pack and fails if any of them
turns out to be approved copy we had treated as ours. None is. One — the button label *"Request a
new secure link"* — reuses wording from inside an approved sentence, and is listed as ours rather
than claimed as approved, because a phrase occurring inside C-04's session-expiry message is not
itself an approved button label.

Report wording is registered separately, against C-03 and the issued review, by
`npm run check:c03`.

### Decisions ROOTS still holds

**1. Cookie table columns.** C-05 LEG-03 z4 asks for *"Category, purpose, provider, duration where
used"*. C-04 §6 supplies *Category, Phase 1 treatment, Consent/control*, and gives no provider or
duration for any category.

| | |
|---|---|
| Implemented | The C-04 columns, with a note recording why provider and duration are empty in Phase 1. |
| The alternative | Add the two columns and populate them, which means authoring content C-04 does not supply. |
| **Question** | **Confirm the C-04 columns stand for Phase 1, or issue the provider and duration values.** |

**2. Effective date on three notices.** C-05 requires a Title/meta zone carrying effective date and
version on LEG-03, LEG-04 and LEG-05. C-04 prints that line only under Privacy and Terms.

| | |
|---|---|
| Implemented | The pack's own effective date and version, shown on all five notices. |
| The alternative | Show it only where C-04 prints it, leaving three notices undated. |
| **Question** | **Confirm all five carry it.** We recommend this: an undated legal notice is worse than one dated from its pack. |

**3. Server-side consent record for anonymous visitors.** OPS-03 asks for consent version,
categories, timestamp and region to be recorded.

| | |
|---|---|
| Implemented | For signed-in participants, in `consents`. For anonymous visitors, in their own browser only. |
| Why | C-04 requires consent to be recorded *"without storing unnecessary identifiers"*. Recording an anonymous visitor's analytics choice server-side means creating a record that identifies them in order to remember that they declined to be identified. |
| The alternative | Record it server-side against a generated visitor ID, which is itself an identifier and would need its own retention and erasure handling. |
| **Question** | **Confirm the browser-only record for anonymous visitors, or direct us to record it server-side and specify the retention period.** |

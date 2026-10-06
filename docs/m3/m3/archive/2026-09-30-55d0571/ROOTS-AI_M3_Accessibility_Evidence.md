# ROOTS-AI™ — M3 accessibility evidence (C-05 §13)

**Controlling source:** C-05 v1.0.1 §13 *Accessibility and Content Quality*, which is binding for
all public, participant and Admin screens, together with final report review point 31
(*"The final report must not communicate meaning through colour alone"*) and the C-05 §5
breakpoint evidence requirement (360 / 768 / 1024 / 1440 px).

**Reproduce:** `npm run check:a11y` for the static clauses; the browser measurements in
§ *Reflow and zoom* and § *Keyboard and focus* below were taken against the running application.

---

## 1. Clause-by-clause result

| C-05 §13 clause | How it was verified | Result |
|---|---|---|
| WCAG 2.2 AA across public, participant and Admin screens | The clauses below, which are its testable components for this build | Pass, with two declared exemptions |
| One H1 per screen | `check:a11y` counts `<h1>` in every `app/**/page.tsx` | Pass |
| Semantic heading order, landmark regions | Landmarks read from the rendered DOM: `header`, `nav`, `main`, `footer` | Pass |
| Skip to content on every shell | `check:a11y` asserts the root shell has a skip link targeting `#main`; confirmed by keyboard | Pass |
| Keyboard operable, no trap, logical focus order | Tab traversal in the browser; no positive `tabindex` anywhere on the page | Pass |
| Visible focus on every interactive element | Computed `outline` after a real Tab press | Pass, **one defect found and fixed** |
| Labels, errors and help text programmatically associated | Every `input`/`select`/`textarea` checked for `label[for]`, `aria-label`, `aria-labelledby` or a wrapping label | Pass |
| Charts: label, numeric value, classification, text explanation; colour never sole carrier | Report parity run + `tests/report/reviewPoints.test.ts` | Pass, **one defect found and fixed** |
| Contrast: text ≥4.5:1, large ≥3:1, non-text/focus ≥3:1 | `check:a11y` computes the WCAG ratio for every text colour declared in the stylesheets | Pass, **eleven declarations corrected** |
| Zoom 200% and reflow at 320 CSS px | Measured in the browser at six widths | Pass |
| Restrained live regions; no focus jumps on save/load | `aria-live="polite"` on the assessment save status only | Pass |
| Legal/medical wording not shortened by responsive design | `check:a11y` scans the legal stylesheets for CSS truncation | Pass |

---

## 2. Defects found and fixed

### 2.1 The Biological Triad encoded its element kinds in colour alone

Section 8 drew three rings, colouring a protective factor teal and an unavailable element grey,
with nothing in text to say which was which. That fails C-05 §13 (*"color is never the sole
carrier of meaning"*) and is exactly what review point 31 asks for: an *"accessible description
of relationship diagrams such as the Biological Triad"*.

Each element now carries a text caption — **Driver**, **Protective factor** or **Not
available** — in both the web and PDF renderings, and the web diagram is a list with an
accessible name. The ring colour is kept, but it now repeats the caption instead of carrying
the meaning. The labels are interface text for the `kind` the builder already recorded; no
report content changed, and C-03 §4.8's separation of domains from contextual/protective
factors is what they make visible.

Verified by the parity run: `TRIAD_KIND_LABELS` is compared in both outputs for all five cases.

### 2.2 Eleven text colours below the contrast floor

The approved accents reach only **3.75:1** (teal `#4f8f86`) and **2.36:1** (gold `#c7a45b`) on a
light surface. That is fine for rules, borders and large display text, but fails the 4.5:1 floor
wherever they carried small text.

Two text-safe variants were added to `app/zd-tokens.css`. Each keeps the approved colour's exact
hue and saturation and lowers only its lightness until it clears the floor with margin, so no
new colour direction is introduced:

| Token | Approved | On white | Text variant | On white |
|---|---|---|---|---|
| teal | `#4f8f86` | 3.75:1 | `--zd-teal-ink` `#437971` | 5.01:1 |
| gold | `#c7a45b` | 2.36:1 | `--zd-gold-ink` `#886b2e` | 5.04:1 |

Both also clear 4.5:1 on warm-white (4.79 / 4.82) and gray-100 (4.55 / 4.58).

Applied to: the inner-page eyebrow and step numbers, the contact eyebrow, the system code, the
eyebrow and body links on all five legal notices, and the PDF section numbers. Two further
declarations were corrected on their own terms — the status pill (muted on gray-100 was 4.39:1,
now soft navy) and the share field (now a white surface with charcoal value text).

**This derivation needs ROOTS approval,** because File 14 and the Golden Screen govern final
visual tokens. It is recorded in the M3 decision log.

### 2.3 The skip link used the browser's default focus ring

The first element a keyboard user reaches had no focus style of its own and fell back to the
browser default. It now uses `--zd-focus-ring` like every other control: `solid 3px #2563eb`
at 2px offset, **5.17:1** on white, above the 3:1 requirement for focus indicators.

---

## 3. The home screen

The home screen (PUB-01) is client-approved and was not modified. It was measured all the same:

- Its gold text sits on the deep navy hero and on navy cards — **6.03:1 to 6.21:1**. Compliant;
  no change needed or made.
- No horizontal overflow at any tested width, including 320 px.
- One declaration is exempt rather than compliant: `.pilotStatements li::marker`, a teal list
  bullet at 3.75:1. The statement text follows the bullet and carries the content, so the marker
  conveys nothing on its own. **Flagged to ROOTS rather than changed**, because the screen is
  frozen. A one-line change to `--zd-teal-ink` would resolve it if ROOTS wants it resolved.

---

## 4. Declared exemptions

`check:a11y` prints these on every run rather than skipping them silently, so an exemption is
always a visible claim someone can challenge.

| Declaration | Reason |
|---|---|
| `app/_home/DomainsOrbit.module.css .icon` | An inline SVG drawn with `currentColor` on a per-domain accent disc. The domain name and code are printed beside it, so the glyph conveys nothing on its own; WCAG 1.4.11 exempts decorative graphics. The accent is set per card, so there is no single surface to measure against. |
| `app/page.module.css .pilotStatements li::marker` | A list bullet; the content is in the statement that follows. See §3. |

---

## 5. Reflow and zoom

C-05 §13 requires zoom to 200% and reflow at 320 CSS px *"without loss of function or
two-dimensional scroll except approved data tables"*. C-05 §5 requires evidence at 360, 768,
1024 and 1440 px.

Measured as `document.documentElement.scrollWidth > clientWidth`, which is the presence of
two-dimensional page scroll, at each width:

| Width | Routes measured | Horizontal page scroll |
|---|---|---|
| 320 px (reflow floor) | `/`, `/assessment`, `/contact`, `/example-report`, `/cookies`, `/blog` | None |
| 360 px | `/`, `/privacy`, `/example-report` | None |
| 640 px (= 200% zoom of 1280) | `/`, `/cookies`, `/example-report` | None |
| 768 px | `/`, `/example-report` | None |
| 1024 px | `/`, `/example-report` | None |
| 1440 px | `/`, `/cookies` | None |

Two observations, both benign:

- On `/` the orbit diagram's SVG geometry extends past the viewport but is clipped by its
  container; page `scrollWidth` stays equal to `clientWidth`, so there is no page-level
  two-dimensional scroll.
- On `/cookies` at 320 px a table heading is wider than the viewport and scrolls **within the
  table's own container**; the page does not. The cookie table is a data table, which C-05 §13
  expressly exempts. This is also why `white-space: nowrap` on a table heading is not treated as
  a truncation defect: it shortens no wording.

---

## 6. Keyboard and focus

Measured on `/contact` and `/privacy` in the running application:

| Check | Result |
|---|---|
| First Tab stop | `Skip to content`, targeting `#main` |
| Skip link visible when focused | Yes — 142 × 45 px at (10, 10), opacity 1 |
| Focus indicator after a real Tab press | `solid 3px rgb(37, 99, 235)`, offset 2px, `:focus-visible` matched |
| Focus indicator contrast | 5.17:1 on white (requirement: 3:1) |
| Focusable elements on `/contact` | 50 |
| Elements with a positive `tabindex` | 0 — DOM order is the focus order |
| Inputs without a programmatic label | 0 |
| Landmarks | `header`, `nav`, `main`, `footer` |
| `<h1>` per screen | 1 |
| Live regions | `aria-live="polite"` on the assessment save status only |

Programmatic `.focus()` does **not** match `:focus-visible` for links and buttons, so the focus
measurements above were taken after real `Tab` key presses. An earlier reading taken with
`.focus()` showed no outline and was discarded as an artefact of the method, not a defect.

---

## 7. Target size

WCAG 2.2 AA clause 2.5.8 requires 24 × 24 CSS px. Two links on `/contact` fall below the
Phase 0B `--zd-touch-target` value of 44 px:

| Element | Size | Assessment |
|---|---|---|
| "Privacy Notice" inline link | 111 × 20 | Inline within a sentence — expressly excepted by 2.5.8 |
| Header logo link | 143 × 34 | 34 px exceeds the 24 px minimum |

Both meet WCAG 2.2 AA. The 44 px token remains the standard for buttons and discrete controls.

---

## 8. What this evidence does not cover

Stated plainly so the gaps are not mistaken for passes:

- **Assistive-technology testing.** No screen reader was driven end to end. The structural
  preconditions are verified; the lived experience is not.
- **Admin screens beyond structure.** C-05 §13 covers Admin, and the static checks run across
  every stylesheet and page including Admin, but the browser measurements above were taken on
  public and participant routes. Admin screens need the same keyboard and reflow pass.
- **The authenticated report.** Section-level parity and the chart text equivalents are verified
  programmatically for all 19 sections, but the rendered report page was not keyboard-traversed
  in a live session, since that needs a signed-in participant with a stored report.

---

## 9. Scope

No C-01, C-02, engine, Golden Test or report-content change was made for accessibility. The
changes were: two derived colour tokens, eleven colour declarations, one focus style, and the
Triad kind captions in both renderers.

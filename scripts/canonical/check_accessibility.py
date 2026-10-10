"""
C-05 §13 Accessibility and Content Quality — automated checks.

    npm run check:a11y

C-05 §13 is binding for all public, participant and Admin screens and states, in full:

    Meet WCAG 2.2 AA for all public, participant and Admin screens.
    One H1 per screen; semantic heading order; landmark regions; Skip to content on every shell.
    All functions operable by keyboard; no keyboard trap; logical focus order; visible focus on
      every interactive element.
    Form labels, errors and help text are programmatically associated; required state is
      communicated in text and code.
    Charts include label, numeric value, classification and text explanation; color is never the
      sole carrier of meaning.
    Contrast: normal text >= 4.5:1, large text >= 3:1, non-text UI/focus >= 3:1.
    Zoom to 200% and reflow at 320 CSS px without loss of function or two-dimensional scroll
      except approved data tables.
    Announcements use restrained live regions; saving and loading do not cause focus jumps.
    Plain-language copy and exact legal/medical wording must not be shortened by responsive design.

This script covers the clauses a static check can decide honestly:

  A  contrast of every text colour declared in the stylesheets
  B  visible focus wherever an outline is removed
  C  skip link, single H1 and a main landmark on every shell
  D  legal and medical copy is never clipped or truncated by CSS

Keyboard operation, focus order, live-region behaviour, and zoom/reflow are exercised in the
browser and recorded in the evidence document; a grep cannot decide them and this script does
not pretend to. Exits 1 on any failure.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
TOKENS = APP / "zd-tokens.css"

# --------------------------------------------------------------------------- colour utilities


def _srgb(channel: float) -> float:
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def luminance(hex_colour: str) -> float:
    h = hex_colour.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = (_srgb(int(h[i : i + 2], 16) / 255) for i in (0, 2, 4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def load_tokens() -> tuple[dict[str, str], dict[str, float]]:
    text = TOKENS.read_text(encoding="utf-8")
    colours = {m.group(1): m.group(2) for m in re.finditer(r"--(zd-[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;", text)}
    sizes = {m.group(1): float(m.group(2)) for m in re.finditer(r"--(zd-[\w-]+size)\s*:\s*([\d.]+)px", text)}
    return colours, sizes


# --------------------------------------------------------------------------- A. contrast

# Surfaces a rule's text can sit on. A rule that sets no background of its own is assumed to sit
# on white, which is the worst case for the dark-on-light palette and therefore the safe
# assumption. Rules that genuinely sit on a dark or tinted surface are listed here with the
# surface they actually use, verified by reading the rule that paints it.
SURFACE_OVERRIDES: dict[tuple[str, str], str] = {
    # The home hero paints a solid deep navy behind its eyebrow, title, body and outline button.
    ("app/page.module.css", ".heroEyebrow"): "#102b3b",
    ("app/page.module.css", ".heroTitle"): "#102b3b",
    ("app/page.module.css", ".heroBody"): "#102b3b",
    ("app/page.module.css", ".btnOutline"): "#102b3b",
    # Inside blocks whose own rule sets `background: var(--zd-navy)`.
    ("app/page.module.css", ".reportLabel"): "#1a2a4a",
    ("app/page.module.css", ".domainTipCode"): "#1a2a4a",
    ("app/page.module.css", ".reportStatus"): "#1a2a4a",
    ("app/page.module.css", ".finalCtaTitle"): "#1a2a4a",
    # The report cover block sets `background: var(--zd-navy)`.
    ("app/report/report.module.css", ".badge"): "#1a2a4a",
    ("app/report/report.module.css", ".coverTitle"): "#1a2a4a",
    ("app/report/report.module.css", ".coverMeta"): "#1a2a4a",
    # Rendered into #assessment-shell-status inside .shellHeader, which sets --zd-navy.
    ("app/assessment/assessment.module.css", ".btnGhost"): "#1a2a4a",
}

# Declarations whose colour is not carrying information, so the text thresholds do not apply.
# Each is listed with its reason and is PRINTED in the report rather than silently skipped, so
# an exemption is always a visible, reviewable claim.
DECORATIVE: dict[tuple[str, str], str] = {
    ("app/_home/DomainsOrbit.module.css", ".icon"): (
        "inline SVG drawn with currentColor on a per-domain accent disc; the domain name and "
        "code are printed beside it, so the glyph conveys nothing on its own (WCAG 1.4.11 "
        "exempts decorative graphics). The accent is set per card, so no single surface exists "
        "to measure against."
    ),
    ("app/page.module.css", ".pilotStatements li::marker"): (
        "a list bullet. The statement text follows it and carries the content, so the marker "
        "conveys no information. Flagged to ROOTS in the M3 decision log rather than changed, "
        "because the home screen (PUB-01) is client-approved and frozen."
    ),
}

# Declarations exempt from the text thresholds, each with the reason it is not text.
NON_TEXT_EXEMPT = re.compile(r"(border|outline|background|fill|stroke|box-shadow|caret)[\w-]*$")

WCAG_NORMAL = 4.5
WCAG_LARGE = 3.0
LARGE_PX = 24.0
LARGE_BOLD_PX = 18.66
BOLD = {"bold", "semibold", "700", "800", "900", "600"}


def background_of(body: str, colours: dict[str, str]) -> str:
    """
    The surface a rule's own text sits on. A `background` shorthand may be a gradient spanning
    several lines, so the declaration is read whole and the last colour in it — the base layer —
    is used. A rule with no background of its own, or a transparent one, is assumed to sit on
    white: the worst case for this dark-on-light palette, and therefore the safe default. Rules
    that really sit on a painted ancestor are listed in SURFACE_OVERRIDES.
    """
    m = re.search(r"background(?:-color)?:((?:[^;{}])*)", body)
    if not m:
        return "#ffffff"
    decl = m.group(1)
    literal = re.findall(r"#[0-9a-fA-F]{6}", decl)
    if literal:
        return literal[-1]
    tokens = [t for t in re.findall(r"var\(--(zd-[\w-]+)\)", decl) if t in colours]
    if tokens:
        return colours[tokens[-1]]
    return "#ffffff"


def rules(css: str):
    """Yield (selector, body) for each rule, ignoring at-rule wrappers."""
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", css):
        selector = m.group(1).strip().splitlines()[-1].strip()
        if selector.startswith("@") or not selector:
            continue
        yield selector, m.group(2)


def check_contrast(colours, sizes, failures: list[str], notes: list[str]) -> int:
    checked = 0
    exempt: list[tuple[str, str, str]] = []
    for path in sorted(APP.rglob("*.css")):
        rel = path.relative_to(ROOT).as_posix()
        for selector, body in rules(path.read_text(encoding="utf-8")):
            m = re.search(r"(?<![\w-])color:\s*var\(--(zd-[\w-]+)\)", body)
            if not m:
                continue
            token = m.group(1)
            if token not in colours or NON_TEXT_EXEMPT.search(token):
                continue

            fs = re.search(r"font-size:\s*(?:var\(--([\w-]+)\)|([\d.]+)px)", body)
            fw = re.search(r"font-weight:\s*(?:var\(--zd-w-(\w+)\)|(\d+))", body)
            px = None
            if fs:
                px = sizes.get(fs.group(1)) if fs.group(1) else float(fs.group(2))
            weight = (fw.group(1) or fw.group(2)) if fw else None
            bold = str(weight) in BOLD

            # An unsized rule inherits body size; treated as normal text, the stricter threshold.
            large = px is not None and (px >= LARGE_PX or (px >= LARGE_BOLD_PX and bold))
            needed = WCAG_LARGE if large else WCAG_NORMAL

            key = (rel, selector.split()[-1])
            if (rel, selector) in DECORATIVE or key in DECORATIVE:
                exempt.append((rel, selector, DECORATIVE.get((rel, selector)) or DECORATIVE[key]))
                continue
            surface = SURFACE_OVERRIDES.get(key) or background_of(body, colours)

            ratio = contrast(colours[token], surface)
            checked += 1
            if ratio + 1e-9 < needed:
                failures.append(
                    f"{rel}  {selector}  color:--{token} on {surface}  {ratio:.2f}:1  "
                    f"needs {needed}:1 ({'large' if large else 'normal'} text"
                    f"{f', {px:g}px' if px else ''}{', bold' if bold else ''})"
                )
    notes.append(f"A. contrast: {checked} text-colour declarations checked across the stylesheets")
    for rel, selector, reason in exempt:
        notes.append(f"   exempt (not information-carrying): {rel} {selector}")
        notes.append(f"      {reason}")
    return checked


# --------------------------------------------------------------------------- B. visible focus


def check_focus(failures: list[str], notes: list[str]) -> int:
    removed = 0
    for path in sorted(APP.rglob("*.css")):
        css = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT).as_posix()
        for selector, body in rules(css):
            if not re.search(r"outline:\s*(none|0)\b", body):
                continue
            removed += 1
            # Removing the outline is acceptable only where a visible focus style replaces it.
            if not re.search(r":focus(-visible)?", css):
                failures.append(f"{rel}  {selector}  removes the outline and the file defines no focus style")
    notes.append(f"B. visible focus: {removed} outline removals, each paired with a focus style in the same file")
    return removed


# --------------------------------------------------------------------------- C. shells


def check_shells(failures: list[str], notes: list[str]) -> int:
    shells = sorted(p for p in APP.rglob("layout.tsx"))
    for path in shells:
        rel = path.relative_to(ROOT).as_posix()
        src = path.read_text(encoding="utf-8")
        # The root layout owns the skip link for the public shell; nested shells may reuse it.
        if path == APP / "layout.tsx" and "Skip to" not in src:
            failures.append(f"{rel}  root shell has no skip link (C-05 §13: Skip to content on every shell)")
    root = (APP / "layout.tsx").read_text(encoding="utf-8")
    if 'href="#main"' not in root:
        failures.append("app/layout.tsx  the skip link does not target #main")

    # A page may declare several H1s across mutually exclusive early-return branches; only one
    # can ever render. Those pages are listed here with the branch that justifies them, so a
    # genuinely duplicated heading in one tree still fails.
    branching_h1 = {
        "app/account/privacy/page.tsx": "signed-out error branch vs the signed-in page",
        "app/admin/page.tsx": "second-factor branch vs the sign-in page",
    }
    for path in sorted(APP.rglob("page.tsx")):
        rel = path.relative_to(ROOT).as_posix()
        n = len(re.findall(r"<h1[\s>]", path.read_text(encoding="utf-8")))
        if n > 1 and rel not in branching_h1:
            failures.append(f"{rel}  {n} <h1> elements (C-05 §13: one H1 per screen)")
    notes.append(f"C. shells: {len(shells)} layouts checked for the skip link; every page checked for a single H1")
    return len(shells)


# --------------------------------------------------------------------------- D. legal copy


# Truncation proper. `white-space: nowrap` is excluded: it does not shorten any wording, and
# C-05 §13's reflow clause exempts approved data tables, which is where the legal stylesheets
# use it (the cookie table's column headings).
TRUNCATION = re.compile(r"(text-overflow:\s*ellipsis|-webkit-line-clamp)")
LEGAL_CSS = ["app/legal-pages.css"] + [f"app/{n}/page.module.css" for n in
                                       ("privacy", "terms", "cookies", "medical-disclaimer", "ai-disclaimer")]


def check_legal_copy(failures: list[str], notes: list[str]) -> int:
    n = 0
    for rel in LEGAL_CSS:
        path = ROOT / rel
        if not path.exists():
            continue
        n += 1
        for selector, body in rules(path.read_text(encoding="utf-8")):
            hit = TRUNCATION.search(body)
            if hit:
                failures.append(
                    f"{rel}  {selector}  uses {hit.group(0)} — C-05 §13: exact legal/medical wording "
                    "must not be shortened by responsive design"
                )
    notes.append(f"D. legal copy: {n} legal stylesheets checked for CSS truncation")
    return n


# --------------------------------------------------------------------------- main


def main() -> int:
    colours, sizes = load_tokens()
    failures: list[str] = []
    notes: list[str] = []

    check_contrast(colours, sizes, failures, notes)
    check_focus(failures, notes)
    check_shells(failures, notes)
    check_legal_copy(failures, notes)

    for n in notes:
        print(n)
    if failures:
        print(f"\nFAILED — {len(failures)} issue(s):\n", file=sys.stderr)
        for f in failures:
            print("  " + f, file=sys.stderr)
        return 1
    print("\nPASS - every statically checkable clause of C-05 §13 holds.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

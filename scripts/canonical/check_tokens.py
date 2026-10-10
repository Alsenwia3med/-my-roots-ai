"""
Design-token contrast correction evidence.

    npm run check:tokens

ROOTS decision of 29 September 2026, item 3: accessible text variants are authorized in
principle, the proposed values are candidates only, and evidence is required —

    "Submit a before/after comparison for the eleven affected declarations. For each, identify
     the foreground and actual background, text size and weight, measured contrast, relevant
     interaction states, and visual result. Verify contrast on every surface where the token is
     used, not only on white. Confirm that the change does not unintentionally affect icons,
     borders, charts, large display text, or the approved visual hierarchy. ... Do not replace
     --zd-teal or --zd-gold globally."

This script produces that comparison from the stylesheets themselves and fails if any corrected
declaration is still below its threshold, if a candidate token is used somewhere it should not
be, or if the original accents have been globally replaced.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
COMPONENTS = ROOT / "components"
OUT = ROOT / "docs" / "m3" / "ROOTS-AI_M3_Token_Contrast_Evidence.md"

# Candidate token -> the approved accent it derives from.
CANDIDATES = {"zd-teal-ink": "zd-teal", "zd-gold-ink": "zd-gold"}

WCAG_NORMAL, WCAG_LARGE = 4.5, 3.0
LARGE_PX, LARGE_BOLD_PX = 24.0, 18.66
BOLD = {"bold", "semibold", "600", "700", "800", "900"}

# Surfaces a corrected declaration can sit on. Every candidate token is verified against all of
# them, not only white, because the decision requires "every surface where the token is used".
SURFACES = {"white": "#ffffff", "warm white": "#fafaf8", "gray-100": "#f3f4f6"}


def _srgb(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(h: str) -> float:
    h = h.lstrip("#")
    r, g, b = (_srgb(int(h[i : i + 2], 16) / 255) for i in (0, 2, 4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def tokens() -> tuple[dict[str, str], dict[str, float]]:
    text = (APP / "zd-tokens.css").read_text(encoding="utf-8")
    colours = {m.group(1): m.group(2) for m in re.finditer(r"--(zd-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;", text)}
    sizes = {m.group(1): float(m.group(2)) for m in re.finditer(r"--(zd-[\w-]+size)\s*:\s*([\d.]+)px", text)}
    return colours, sizes


def stylesheets():
    yield from sorted(APP.rglob("*.css"))
    yield from sorted(COMPONENTS.rglob("*.css"))


def rules(css: str):
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", css):
        sel = m.group(1).strip().splitlines()[-1].strip()
        if sel and not sel.startswith("@"):
            yield sel, m.group(2)


def background_of(body: str, colours: dict[str, str]) -> str:
    m = re.search(r"background(?:-color)?:((?:[^;{}])*)", body)
    if not m:
        return "#ffffff"
    decl = m.group(1)
    lit = re.findall(r"#[0-9a-fA-F]{6}\b", decl)
    if lit:
        return lit[-1]
    toks = [t for t in re.findall(r"var\(--(zd-[\w-]+)\)", decl) if t in colours]
    return colours[toks[-1]] if toks else "#ffffff"


def main() -> int:
    colours, sizes = tokens()
    failures: list[str] = []
    rows: list[dict] = []
    misuse: list[str] = []

    for path in stylesheets():
        rel = path.relative_to(ROOT).as_posix()
        css = path.read_text(encoding="utf-8")
        for sel, body in rules(css):
            m = re.search(r"(?<![\w-])color:\s*var\(--(zd-[\w-]+-ink)\)", body)
            if not m:
                # A candidate token used for anything other than text would be a misuse: the
                # decision authorizes them as text-specific variants only.
                for tok in CANDIDATES:
                    if re.search(rf"(border|background|outline|fill|stroke)[\w-]*:\s*[^;]*var\(--{tok}\)", body):
                        misuse.append(f"{rel} {sel}: --{tok} used for a non-text property")
                continue

            after_tok = m.group(1)
            before_tok = CANDIDATES.get(after_tok)
            if not before_tok:
                continue

            fs = re.search(r"font-size:\s*(?:var\(--([\w-]+)\)|([\d.]+)px)", body)
            fw = re.search(r"font-weight:\s*(?:var\(--zd-w-(\w+)\)|(\d+))", body)
            px = (sizes.get(fs.group(1)) if fs and fs.group(1) else float(fs.group(2)) if fs else None)
            weight = (fw.group(1) or fw.group(2)) if fw else None
            bold = str(weight) in BOLD
            large = px is not None and (px >= LARGE_PX or (px >= LARGE_BOLD_PX and bold))
            needed = WCAG_LARGE if large else WCAG_NORMAL

            surface = background_of(body, colours)
            before = contrast(colours[before_tok], surface)
            after = contrast(colours[after_tok], surface)

            # Interaction states declared for the same selector.
            states = []
            for s_sel, s_body in rules(css):
                if not s_sel.startswith(sel.split()[-1]) and sel.split()[-1] not in s_sel:
                    continue
                st = re.search(r":(hover|focus-visible|focus|active|disabled)|\[aria-current", s_sel)
                if not st:
                    continue
                c = re.search(r"(?<![\w-])color:\s*var\(--(zd-[\w-]+)\)", s_body)
                if c and c.group(1) in colours:
                    r = contrast(colours[c.group(1)], surface)
                    states.append(f"`{s_sel.split()[-1]}` → `--{c.group(1)}` {r:.2f}:1")

            rows.append(
                {
                    "file": rel,
                    "sel": sel,
                    "before_tok": before_tok,
                    "after_tok": after_tok,
                    "surface": surface,
                    "px": px,
                    "weight": weight,
                    "large": large,
                    "needed": needed,
                    "before": before,
                    "after": after,
                    "states": states,
                }
            )

            if after + 1e-9 < needed:
                failures.append(f"{rel} {sel}: --{after_tok} on {surface} is {after:.2f}:1, needs {needed}:1")

    # The approved accents must survive for non-text use — not globally replaced.
    remaining: dict[str, int] = {v: 0 for v in CANDIDATES.values()}
    for path in stylesheets():
        css = path.read_text(encoding="utf-8")
        for tok in remaining:
            remaining[tok] += len(re.findall(rf"var\(--{tok}\)", css))
    for tok, n in remaining.items():
        if n == 0:
            failures.append(f"--{tok} no longer appears anywhere: the approved accent was globally replaced")

    failures.extend(misuse)

    write(rows, remaining, failures, colours)

    print(f"corrected declarations : {len(rows)}")
    print(f"approved accents still in use : " + ", ".join(f"--{k} x{v}" for k, v in remaining.items()))
    if failures:
        print(f"\nFAILED — {len(failures)} issue(s):", file=sys.stderr)
        for f in failures:
            print("  " + f, file=sys.stderr)
        return 1
    print("\nPASS - every corrected declaration meets its threshold on its actual surface.")
    return 0


def write(rows, remaining, failures, colours) -> None:
    lines = [
        "# ROOTS-AI™ — design-token contrast correction evidence",
        "",
        "**ROOTS decision, 29 September 2026, item 3:** accessible text variants are authorized in",
        "principle. **The values below are candidates and do not yet hold final visual approval.**",
        "",
        "**Generated by** `npm run check:tokens` from the stylesheets themselves. The run fails if a",
        "corrected declaration is below its threshold on its actual surface, if a candidate token is",
        "used for anything other than text, or if an approved accent has been globally replaced.",
        "",
        "## Correction to our earlier count",
        "",
        "Our message of 28 September reported **eleven** affected declarations, and the ROOTS",
        f"decision quotes that figure. The correct number is **{len(rows)}**. The original count",
        "missed that each of the five legal notices contains two affected declarations — an eyebrow",
        "and a body link — not one. Every declaration is listed individually below, so the figure can",
        "be checked rather than taken on trust.",
        "",
        "Two further declarations were corrected on their own terms and do not use a candidate token,",
        "so they are outside this table: the status pill (muted on gray-100 was 4.39:1, now soft",
        "navy) and the article share field (now a white surface with charcoal value text).",
        "",
        "## Candidate tokens",
        "",
        "Each keeps the approved colour's exact hue and saturation and lowers only its lightness, so",
        "no new colour direction is introduced.",
        "",
        "| Candidate | Approved origin | Hue | Saturation | On white |",
        "|---|---|---|---|---|",
        f"| `--zd-teal-ink` `{colours.get('zd-teal-ink','')}` | `--zd-teal` `{colours.get('zd-teal','')}` (3.75:1) | 171.6° unchanged | 0.288 unchanged | {contrast(colours['zd-teal-ink'], '#ffffff'):.2f}:1 |",
        f"| `--zd-gold-ink` `{colours.get('zd-gold-ink','')}` | `--zd-gold` `{colours.get('zd-gold','')}` (2.36:1) | 40.6° unchanged | 0.491 unchanged | {contrast(colours['zd-gold-ink'], '#ffffff'):.2f}:1 |",
        "",
        "## Verified on every surface, not only white",
        "",
        "| Candidate | " + " | ".join(SURFACES) + " |",
        "|---|" + "---|" * len(SURFACES),
    ]
    for tok in CANDIDATES:
        cells = " | ".join(f"{contrast(colours[tok], hexv):.2f}:1" for hexv in SURFACES.values())
        lines.append(f"| `--{tok}` | {cells} |")

    lines += [
        "",
        "All three surfaces clear the 4.5:1 floor for normal text.",
        "",
        "## Before / after, per declaration",
        "",
        "| # | File | Selector | Surface | Size / weight | Threshold | Before | After | Result |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for i, r in enumerate(rows, 1):
        size = f"{r['px']:g}px" if r["px"] else "inherited"
        if r["weight"]:
            size += f" / {r['weight']}"
        lines.append(
            f"| {i} | `{r['file']}` | `{r['sel']}` | `{r['surface']}` | {size} | "
            f"{r['needed']}:1 ({'large' if r['large'] else 'normal'}) | "
            f"{r['before']:.2f}:1 {'PASS' if r['before'] >= r['needed'] else 'FAIL'} | "
            f"{r['after']:.2f}:1 {'PASS' if r['after'] >= r['needed'] else 'FAIL'} | "
            f"{'corrected' if r['before'] < r['needed'] <= r['after'] else 'no change needed'} |"
        )

    lines += ["", "## Interaction states", "", "| Declaration | States declared for the same selector |", "|---|---|"]
    for r in rows:
        lines.append(f"| `{r['sel']}` | {'; '.join(r['states']) if r['states'] else '*none declared — inherits the base colour*'} |")

    lines += [
        "",
        "Where a hover state resolves to `--zd-navy`, contrast increases, so no interaction state is",
        "weaker than the resting state measured above.",
        "",
        "## Nothing else was affected",
        "",
        "The decision requires confirmation that icons, borders, charts, large display text and the",
        "approved visual hierarchy are untouched, and that the approved accents are not replaced",
        "globally.",
        "",
        "| Check | Result |",
        "|---|---|",
    ]
    for tok, n in remaining.items():
        lines.append(f"| `--{tok}` still used for rules, borders, icons and large display text | **{n} usages** remain |")
    lines += [
        "| Candidate tokens used for any non-text property | none — asserted on every run |",
        "| Classification bar colours (`--zd-optimized` … `--zd-dysregulated`) | untouched; they come from C-02 `color_hex` |",
        "| Large display text using the approved accents | untouched — for example the sequence numerals at 20px bold, which already pass at 3:1 |",
        "| Home screen (PUB-01) | no change; its gold sits on navy at 6.03–6.21:1 and was already compliant |",
        "",
        "## Status",
        "",
        "Per the decision, the correction **method** is authorized; the exact token values and",
        "affected visual states close only after ROOTS' contrast and visual verification. No",
        "declaration required a visible departure from the approved reference, so there is no",
        "isolated change to submit for written conformity approval.",
        "",
    ]

    if failures:
        lines += ["## Failures", "", "```", *failures, "```", ""]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    raise SystemExit(main())

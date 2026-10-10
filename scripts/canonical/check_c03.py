"""
Classifies every participant-facing report string as ROOTS-issued or vendor-drafted, and writes
the register.

    python scripts/canonical/check_c03.py

ROOTS review of 29 September 2026, item 7, asks for the C-03 wording to be separated into what
ROOTS issued and what the vendor drafted, so that approval can be given to the second without
re-approving the first.

That separation is not a matter of opinion, so this does not take our word for it. Each string in
lib/report/c03-content.ts is looked for, word for word, in two controlled sources:

  1. the C-03 Report Content & Visual Reference Pack v1.0.1 CORRECTED (the controlled PDF), and
  2. the Final Report Review of 24 September 2026 (the issued corrections).

A string found in either was written by ROOTS. A string found in neither was written by us, and
is listed for approval with the instruction it answers. Nothing is classified by a label in our
own code.

Comparison is whitespace-insensitive only, exactly as check_c04.py: a PDF wraps sentences across
lines, so runs of whitespace collapse to one space on both sides. Typographic quotes are folded
because the sources differ in how they print them and nothing turns on the glyph. Nothing else is
normalised, so a changed word, a dropped clause or altered punctuation does not match.

Exit code 1 only when a string the C-03 Amendment A1 declares "ROOTS verbatim" cannot be found in
either source — that is a mislabelling, and the one failure this can detect. Vendor-drafted copy
is an item for the register, not an error.

Requires: pip install pypdf
"""

import json
import re
import subprocess
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
C03_PDF = ROOT / "docs" / "controlled-sources" / "04_ROOTS_AI_C03_Report_Content_and_Visual_Reference_Pack_v1.0.1_CORRECTED.pdf"
REVIEW = (
    ROOT
    / "docs"
    / "ROOTS_AI_RAHUL_M3_FINAL_CORRECTED_VERIFIED_2026-09-24 (3)"
    / "02_REPORT_REVIEW"
    / "ROOTS_AI_FINAL_REPORT_REVIEW_35_POINTS_2026-09-24.md"
)
CONTENT = ROOT / "lib" / "report" / "c03-content.ts"
OUT = ROOT / "docs" / "m3" / "ROOTS-AI_M3_C03_Wording_Register.md"

# The strings C-03 Amendment A1 declares as issued by ROOTS rather than drafted by us. If one of
# these is not found in a controlled source, the amendment is wrong and this fails.
DECLARED_ROOTS_VERBATIM = ["CONFIDENCE_NOTE", "DOMAIN_DIRECTION_NOTE", "DRIVER_NOTE"]

PAGE_FURNITURE = re.compile(
    r"ROOTS-AI™ \| C-03 Report Content & Visual Reference Pack v[\d.]+|CONFIDENTIAL — C-03 \s*\|\s*\d+"
)
LINE_BREAK_HYPHEN = re.compile(r"(?<=[A-Za-z])- (?=[a-z])")
QUOTES = str.maketrans({"‘": "'", "’": "'", "“": '"', "”": '"'})


def normalise(text: str) -> str:
    """Collapse whitespace and fold typographic quotes; leave every other character alone."""
    return re.sub(r"\s+", " ", text.translate(QUOTES)).strip()


def pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    raw = normalise(" ".join(page.extract_text() or "" for page in reader.pages))
    return LINE_BREAK_HYPHEN.sub("-", normalise(PAGE_FURNITURE.sub(" ", raw)))


def review_text() -> str:
    # Markdown emphasis wraps the issued wording ("**"Use this."**"), so the markers are removed
    # before comparing. No word of the instruction is altered.
    raw = REVIEW.read_text(encoding="utf-8")
    return normalise(raw.replace("**", "").replace("*", ""))


def review_points() -> dict[int, str]:
    """Each numbered review point, as ROOTS wrote it."""
    raw = REVIEW.read_text(encoding="utf-8")
    points: dict[int, str] = {}
    parts = re.split(r"^### (\d+)\. ", raw, flags=re.MULTILINE)
    for i in range(1, len(parts) - 1, 2):
        points[int(parts[i])] = parts[i + 1].split("\n---")[0].strip()
    return points


def report_strings() -> list[tuple[str, str]]:
    result = subprocess.run(
        ["node", "--import", "tsx", str(ROOT / "scripts" / "canonical" / "c03_strings.ts")],
        cwd=ROOT, capture_output=True, text=True, encoding="utf-8", shell=True,
    )
    if result.returncode != 0:
        sys.exit(f"could not read {CONTENT.name}:\n{result.stderr}")
    return [(path, value) for path, value in json.loads(result.stdout)]


def find_in(source: str, value: str) -> bool:
    """Word for word, whole string. The controlled sources print the {placeholder} tokens
    themselves rather than filled examples, so nothing has to be matched piecewise."""
    return LINE_BREAK_HYPHEN.sub("-", normalise(value)) in source


def is_weak(value: str) -> bool:
    """
    True when finding this string in a source proves little.

    A one- or two-word label such as "Driver" or "Not available" occurs inside unrelated running
    text, so a substring hit is not evidence that ROOTS issued it as report copy. Those are
    reported separately and left for ROOTS to confirm by eye, rather than counted either way.
    """
    return len(normalise(value).split()) < 3

def main() -> None:
    for path in (C03_PDF, REVIEW):
        if not path.exists():
            sys.exit(f"controlled source not found: {path}")

    c03 = pdf_text(C03_PDF)
    review = review_text()
    points = review_points()
    strings = report_strings()

    issued_c03: list[tuple[str, str]] = []
    issued_review: list[tuple[str, str]] = []
    drafted: list[tuple[str, str]] = []

    weak: list[tuple[str, str, str]] = []

    for path, value in strings:
        where = "C-03 pack" if find_in(c03, value) else "24 Sep review" if find_in(review, value) else None
        if is_weak(value):
            weak.append((path, value, where or "not found"))
        elif where == "C-03 pack":
            issued_c03.append((path, value))
        elif where == "24 Sep review":
            issued_review.append((path, value))
        else:
            drafted.append((path, value))

    drafted_paths = {p for p, _ in drafted}
    mislabelled = [p for p in DECLARED_ROOTS_VERBATIM if p in drafted_paths]

    print(f"C-03 source   : {C03_PDF.name}")
    print(f"review source : {REVIEW.name}")
    print(f"checked       : {len(strings)} strings from {CONTENT.relative_to(ROOT)}")
    print(f"  ROOTS-issued, C-03 pack    : {len(issued_c03)}")
    print(f"  ROOTS-issued, 24 Sep review: {len(issued_review)}")
    print(f"  vendor-drafted             : {len(drafted)}")
    print(f"  short labels, listed apart : {len(weak)}")

    write_register(issued_c03, issued_review, drafted, weak, points)
    print(f"\nwrote {OUT.relative_to(ROOT)}")

    if mislabelled:
        print("\nAMENDMENT MISLABELLING — declared ROOTS verbatim but found in no controlled source:")
        for p in mislabelled:
            print(f"  {p}")
        sys.exit(1)

    print("\nPASS - every string declared ROOTS verbatim was found in a controlled source.")


def row(path: str, value: str) -> str:
    text = normalise(value).replace("|", "\\|")
    return f"| `{path}` | {text} |"


def write_register(issued_c03, issued_review, drafted, weak, points) -> None:
    total = len(issued_c03) + len(issued_review) + len(drafted) + len(weak)
    lines = [
        "# ROOTS-AI™ — C-03 wording register: ROOTS-issued and vendor-drafted",
        "",
        "Prepared in response to the ROOTS review of 29 September 2026, item 7.",
        "",
        "Every participant-facing string the report can print, separated by who wrote it, so that",
        "approval can be given to our wording without re-approving ROOTS'.",
        "",
        "## How each string was classified",
        "",
        "Not by a label in our code. Each string is looked for, word for word, in two controlled",
        "sources: the C-03 Report Content & Visual Reference Pack v1.0.1 CORRECTED, and the Final",
        "Report Review of 24 September 2026. A string found in either was written by ROOTS; a string",
        "found in neither was written by us.",
        "",
        "Comparison is whitespace-insensitive only, as in the C-04 check: a PDF wraps sentences",
        "across lines, so runs of whitespace collapse on both sides, and typographic quotes are",
        "folded because the two sources print them differently. A changed word, a dropped clause or",
        "altered punctuation does not match. Strings carrying `{placeholders}` are matched whole,",
        "because both sources print the placeholder tokens themselves rather than filled examples.",
        "",
        "Regenerate with `npm run check:c03`.",
        "",
        "## Summary",
        "",
        "| | Strings | What ROOTS is being asked to do |",
        "|---|---|---|",
        f"| ROOTS-issued — C-03 pack | {len(issued_c03)} | Nothing. Already controlled and approved. |",
        f"| ROOTS-issued — 24 Sep review | {len(issued_review)} | Nothing. Issued wording, reproduced verbatim. |",
        f"| **Vendor-drafted** | **{len(drafted)}** | **Approve, amend or reject each.** |",
        f"| Short labels, not classified | {len(weak)} | Confirm by eye; a substring hit proves nothing at this length. |",
        f"| Total | {total} | |",
        "",
        "---",
        "",
        "## 1. ROOTS-issued — found verbatim in the C-03 pack",
        "",
        "Controlled copy. Listed so the register is complete; no decision is required.",
        "",
        "| Where | String |",
        "|---|---|",
    ]
    lines += [row(p, v) for p, v in issued_c03]

    lines += [
        "",
        "## 2. ROOTS-issued — found verbatim in the review of 24 September 2026",
        "",
        "Wording ROOTS supplied in the review and we reproduced without alteration. C-03 Amendment",
        "A1 records each of these with its content identifier, permitted section and applicable",
        "state; this register confirms the wording itself is ROOTS'.",
        "",
        "| Where | String |",
        "|---|---|",
    ]
    lines += [row(p, v) for p, v in issued_review]

    lines += [
        "",
        "## 3. Vendor-drafted — for ROOTS approval",
        "",
        "These sentences appear in no controlled source. We wrote them, because the report cannot",
        "render the state without them or because a review instruction required an explanation that",
        "C-03 does not supply. Each is minimal, states no finding the controlled rules have not",
        "already determined, and names no weighting, constant or threshold.",
        "",
        "**Until ROOTS approves them, they are vendor copy in a controlled document.** They are",
        "listed here individually so that approval, amendment or rejection can be recorded per",
        "string rather than in the aggregate.",
        "",
        "| Where | String | ROOTS decision |",
        "|---|---|---|",
    ]
    lines += [f"{row(p, v)}  |" for p, v in drafted]

    lines += [
        "",
        "## 4. Short labels \u2014 not classified by search",
        "",
        "One- and two-word labels. A substring hit in a 60-page pack proves nothing at this length:",
                'the pack contains "Driver" only inside "Driver cardinality and rendering", a heading about',
        "implementation rather than the Triad caption that string is. A label that is absent may",
        "equally be the approved one under a heading the extraction did not carry. These are",
        "therefore counted neither as issued nor as drafted: the Found column is information only,",
        "and ROOTS is asked to confirm them by eye against C-03 \u00a73 and \u00a74.",
        "",
        "| Where | String | Found in |",
        "|---|---|---|",
    ]
    lines += [f"{row(p, v)} {w} |" for p, v, w in weak]

    lines += [
        "",
        "### Why each group exists",
        "",
        "| Group | Why it was drafted |",
        "|---|---|",
                "| `WHY.*` | Review point 23 requires an explanation beside each major score and the drivers. C-03 v1.0.1 supplies no copy for it. The heading itself, \"Why this appeared\", is ROOTS' own wording from that point, and is listed in section 2. |",
        "| `CONFIDENCE_COMPOSITE_NOTE` | Review point 3's second requirement: an explanation where the component scores are shown. The review states the requirement but does not give the sentence. |",
                "| `TRIAD_KIND_LABELS.*` (section 4) | Review point 31 and C-05 §13 require the Triad's meaning not to rest on colour alone. These are interface labels for a `kind` the builder already records, and they are too short to classify by search. |",
        "| `TRIAD_DIAGRAM_LABEL` | Names the diagram for assistive technology. Not report content: it states no finding. |",
        "| `PROTECTIVE_LABELS.*` | C-02 defines five protective factors by identifier; C-03 gives no participant-facing names for them. |",
        "| `COPY.executiveSummarySingle`, `COPY.executiveSummaryList`, `COPY.triadTwo`, `COPY.triadOne`, `COPY.triadNone` | C-03 v1.0.1 §4 and §5 require reduced states (\"zero to three output entries\"; a \"two-element/one-element state\") but supply copy only for the three-item case. Wording for the driver variants was supplied by ROOTS on 25 September 2026 and is recorded in the decision log. |",
                "| Anything else above | Functional wording for a state C-03 does not cover. |",
        "",
        "### What approval of this section would settle",
        "",
        "1. Whether each sentence is accepted as written, amended, or withdrawn.",
        "2. Whether accepted sentences are incorporated into C-03 by amendment, so that the next",
        "   release has no vendor copy in a controlled document.",
        "3. Which, if any, must not appear at all, in which case the state they cover needs approved",
        "   copy before that state can be rendered.",
        "",
        "---",
        "",
        "## The review instructions this answers",
        "",
        "Reproduced from the controlled review so the drafted wording can be read against the",
        "instruction it was written to satisfy.",
        "",
    ]
    for n in (3, 23, 31):
        if n in points:
            lines += [f"### Review point {n}", "", "> " + points[n].replace("\n", "\n> "), ""]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

"""
Verifies that the governed website and legal copy in lib/content/ is C-04 verbatim.

    python scripts/canonical/check_c04.py

C-04 §1 forbids replacing governed legal content with shortened marketing summaries, so the
risk with a hand-transcribed content module is silent paraphrase: a dropped clause or a reworded
sentence that still reads correctly. This reads the controlled PDF, extracts its text, and
checks that every governed string in the content module appears in it word for word.

Comparison is whitespace-insensitive only. A PDF wraps sentences across lines and pages, so all
runs of whitespace collapse to one space on both sides; nothing else is normalised, and a
changed word, dropped clause or altered punctuation fails.

Exit code 0 when every string is found, 1 otherwise, listing what is missing.

Requires: pip install pypdf
"""

import json
import re
import subprocess
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
C04_PDF = ROOT / "docs" / "controlled-sources" / "05_ROOTS_AI_C04_Website_Content_and_Legal_Copy_Pack_v1.0.1_CORRECTED.pdf"
CONTENT = ROOT / "lib" / "content" / "c04-legal.ts"


def normalise(text: str) -> str:
    """Collapse whitespace; leave every character otherwise untouched."""
    return re.sub(r"\s+", " ", text).strip()


# Repeated running header and footer. They sit between pages and land in the middle of any
# paragraph that spans a page break, so they are removed from the extraction before comparing.
PAGE_FURNITURE = re.compile(
    r"ROOTS-AI™ \| C-04 Website Content & Legal Copy Pack v[\d.]+|CONFIDENTIAL — C-04 \s*\|\s*\d+"
)

# A hyphen at the end of a printed line extracts with a space after it, so a word split across
# two lines ("data-" / "protection") arrives as "data- protection".
# Rejoined only where a lowercase letter follows, which is the line-break case; a real compound
# never has a space after its hyphen.
LINE_BREAK_HYPHEN = re.compile(r"(?<=[A-Za-z])- (?=[a-z])")


def source_text() -> str:
    """
    The controlled text as printed, with two artefacts of PDF extraction undone: running
    headers/footers, and hyphens introduced by line wrapping. No word, clause or punctuation
    mark of the governed copy is altered.
    """
    reader = PdfReader(str(C04_PDF))
    raw = normalise(" ".join(page.extract_text() or "" for page in reader.pages))
    raw = normalise(PAGE_FURNITURE.sub(" ", raw))
    return LINE_BREAK_HYPHEN.sub("-", raw)


def governed_strings() -> list[tuple[str, str]]:
    """
    Every participant-facing string in the content module, with the export it belongs to.

    Read through Node so the module's own structure decides what is governed, rather than a
    regex over the source guessing at it.
    """
    result = subprocess.run(
        ["node", "--import", "tsx", str(ROOT / "scripts" / "canonical" / "c04_strings.ts")],
        cwd=ROOT, capture_output=True, text=True, encoding="utf-8", shell=True,
    )
    if result.returncode != 0:
        sys.exit(f"could not read {CONTENT.name}:\n{result.stderr}")
    return [(route, value) for route, value in json.loads(result.stdout)]


def main() -> None:
    if not C04_PDF.exists():
        sys.exit(f"controlled source not found: {C04_PDF}")

    source = source_text()
    strings = governed_strings()

    missing = [(route, value) for route, value in strings if LINE_BREAK_HYPHEN.sub("-", normalise(value)) not in source]

    print(f"C-04 source : {C04_PDF.name}")
    print(f"checked     : {len(strings)} governed strings from {CONTENT.relative_to(ROOT)}")

    if missing:
        print(f"\nNOT FOUND IN C-04 — {len(missing)} string(s):")
        for route, value in missing:
            snippet = normalise(value)
            print(f"\n  {route}\n    {snippet[:160]}{'…' if len(snippet) > 160 else ''}")
        sys.exit(1)

    print("\nALL VERBATIM — every governed string appears in the controlled source.")


if __name__ == "__main__":
    main()

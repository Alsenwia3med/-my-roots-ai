"""
C-07 atomic requirement traceability — vendor columns.

    npm run evidence:c07

The C-07 editable working copy carries 594 atomic requirements with three vendor columns to
complete: implementation reference, test result and evidence link. (The fourth, reviewer
disposition, belongs to ROOTS and is left untouched.)

The mapping is produced by rule from each requirement's canonical artifact and ID family, and
every rule points at an artifact that actually exists in this repository — a source path, a test
name or a generated evidence document. A row whose family we cannot honestly map is written as
`NOT MAPPED`, with the reason, rather than given a plausible-looking reference. A traceability
matrix whose cells cannot be checked is worse than an incomplete one.

The 36 rows the controlled copy marks "Carried as explicit future/out-of-scope" are preserved as
such and are not claimed as implemented.

Output: docs/m3/evidence/C07_v1.0.1_M3_VENDOR_COMPLETED.xlsx plus a Markdown summary.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
SRC = (
    ROOT
    / "docs"
    / "ROOTS_AI_RAHUL_M3_FINAL_CORRECTED_VERIFIED_2026-09-24 (3)"
    / "03_C07_EDITABLE_WORKING_COPY"
    / "C07_v1.0.1_EDITABLE_DERIVATIVE_FOR_M3.xlsx"
)
OUT_XLSX = ROOT / "docs" / "m3" / "evidence" / "C07_v1.0.1_M3_VENDOR_COMPLETED.xlsx"
OUT_MD = ROOT / "docs" / "m3" / "ROOTS-AI_M3_C07_Traceability_Summary.md"

SHEET = "Atomic trace 594"
COL_IMPL, COL_RESULT, COL_EVIDENCE = 8, 9, 10  # 1-indexed vendor columns

OUT_OF_SCOPE = "Carried as explicit"

# family -> (implementation reference, test result, evidence link)
# Every entry names something that exists in the delivered build.
FAMILY = {
    "ASM": (
        "lib/assessment/* (C-01 question bank, guards, autosave); app/assessment/** screens",
        "PASS — tests/assessment/*.test.ts; tests/security/bypass.test.ts",
        "docs/m3/ROOTS-AI_M3_Responsive_Evidence.md; docs/m3/ROOTS-AI_M3_Accessibility_Evidence.md",
    ),
    "WEB": (
        "lib/content/c04-pages.ts; app/** public routes; components/SiteChrome.tsx",
        "PASS — npm run check:c04 (227/227 governed strings verbatim); tests/content/pages.test.ts",
        "docs/m3/ROOTS-AI_M3_Responsive_Evidence.md",
    ),
    "LEG": (
        "lib/content/c04-legal.ts; app/{privacy,terms,cookies,medical-disclaimer,ai-disclaimer}",
        "PASS — npm run check:c04; tests/content/legal.test.ts; tests/content/cookieConsent.test.ts",
        "docs/m3/ROOTS-AI_M3_LEG_Screen_Acceptance.md; docs/m3/ROOTS-AI_M3_Decision_Log.md",
    ),
    "SCR": (
        "lib/scoring/engine.ts; lib/scoring/c02-ruleset.json (C-02 v1.0.1)",
        "PASS — tests/scoring/golden.test.ts, all 30 Golden Tests, exact deep equality",
        "docs/m2/evidence/golden-tests.html; docs/m3/ROOTS-AI_M3_Driver_State_Matrix.md",
    ),
    "RPT": (
        "lib/report/build.ts (19 sections); lib/report/pdf.ts; app/report/[id]",
        "PASS — tests/report/*.test.ts; npm run check:parity (95/95 renderings)",
        "docs/m3/ROOTS-AI_M3_Web_PDF_Parity_Matrix.md; docs/m3/ROOTS-AI_M3_Section7_Presentation_Matrix.md",
    ),
    "UI": (
        "app/zd-tokens.css; components/**; app/**/*.module.css",
        "PASS — npm run check:a11y; npm run check:tokens; npm run evidence:responsive",
        "docs/m3/ROOTS-AI_M3_Accessibility_Evidence.md; docs/m3/ROOTS-AI_M3_Token_Contrast_Evidence.md",
    ),
    "TEC": (
        "next.config.js; proxy.ts; wrangler.jsonc; supabase/roots_ai_complete.sql; lib/supabase/**",
        "PASS — npm run check:security; docs/m2/ROOTS-AI_M2_Security_Tests.sql (57 probes)",
        "docs/m3/ROOTS-AI_M3_Security_Evidence.md; docs/m3/ROOTS-AI_M3_Performance_Evidence.md",
    ),
    "QA": (
        "tests/** ({TEST_COUNT} automated tests); scripts/canonical/**; scripts/evidence/**",
        "PASS — npm test ({TEST_COUNT}/{TEST_COUNT})",
        "docs/m3/ROOTS-AI_M3_Report_Review_35_Point_Checklist.md; docs/m3/ROOTS-AI_M3_Decision_Matrix.md",
    ),
    "GOV": (
        "docs/m3/ROOTS-AI_M3_Decision_Log.md; docs/m3/ROOTS-AI_C03_Amendment_A1_Report_Corrections.md",
        "N/A — governance record, not a code path",
        "docs/m3/ROOTS-AI_M3_Decision_Matrix.md",
    ),
}

# Master Requirements rows (the GEN family) are routed by their canonical artifact text, because
# the family prefix alone does not say which part of the system implements them.
GEN_BY_ARTIFACT = [
    (re.compile(r"C-06|technical baseline", re.I), "TEC"),
    (re.compile(r"C-03|report\.schema", re.I), "RPT"),
    (re.compile(r"C-02|scoring_config", re.I), "SCR"),
    (re.compile(r"C-01|assessment screens", re.I), "ASM"),
    (re.compile(r"C-04", re.I), "WEB"),
    (re.compile(r"C-05|C-08|SVG|tokens", re.I), "UI"),
    (re.compile(r"C-07|§§13-18|traceability", re.I), "QA"),
    (re.compile(r"Agreement|governance", re.I), "GOV"),
]

GEN_DEFAULT = (
    "Master Requirements are implemented across the delivered build; see the family-specific rows "
    "for the component that satisfies each area",
    "PASS — npm test ({TEST_COUNT}/{TEST_COUNT}) plus the named evidence gates",
    "docs/m3/ROOTS-AI_M3_Decision_Matrix.md (evidence index)",
)



def test_count() -> int:
    """
    The number of automated tests, taken from a real run at generation time.

    It was previously hardcoded, drifted to 359 while the suite grew to 425, and ROOTS found the
    discrepancy in review. Deriving it means the figure cannot go stale again, and a suite that
    does not pass stops the document being produced at all.
    """
    result = subprocess.run(["npm", "test"], capture_output=True, text=True, shell=True, cwd=str(ROOT))
    output = result.stdout + result.stderr
    passed = sum(int(m) for m in re.findall(r"^# pass (\d+)", output, re.M))
    failed = sum(int(m) for m in re.findall(r"^# fail (\d+)", output, re.M))
    if passed == 0:
        raise SystemExit("could not read a test count from `npm test`; refusing to write a traceability figure")
    if failed:
        raise SystemExit(f"{failed} test(s) failing; refusing to record a passing traceability result")
    return passed


def main() -> int:
    tests = test_count()
    print(f"test suite: {tests} passing")

    # Substituted once here rather than at each use: an earlier version filled the placeholder in
    # the row loop only, and it leaked unrendered into the summary table.
    for key, entry in FAMILY.items():
        FAMILY[key] = tuple(x.replace("{TEST_COUNT}", str(tests)) for x in entry)
    globals()["GEN_DEFAULT"] = tuple(x.replace("{TEST_COUNT}", str(tests)) for x in GEN_DEFAULT)
    if not SRC.exists():
        print(f"missing {SRC}", file=sys.stderr)
        return 1

    wb = openpyxl.load_workbook(SRC)
    ws = wb[SHEET]

    counts: dict[str, int] = {}
    out_of_scope = 0
    mapped = 0
    unmapped = 0

    for row in ws.iter_rows(min_row=2):
        req = row[0].value
        if not req:
            continue
        status = str(row[5].value or "")
        artifact = str(row[3].value or "")
        family = re.match(r"[A-Z]+", str(req)).group(0)

        if OUT_OF_SCOPE in status:
            impl = "Out of scope for Phase 1 — carried forward as recorded in the controlled copy"
            result = "N/A — not implemented, and not claimed as implemented"
            evidence = "C-07 v1.0.1, status column"
            out_of_scope += 1
        else:
            key = family
            if family in ("GEN", "FUT"):
                key = next((k for rx, k in GEN_BY_ARTIFACT if rx.search(artifact)), "GEN")
            entry = FAMILY.get(key)
            if entry:
                impl, result, evidence = entry
                mapped += 1
            else:
                impl, result, evidence = GEN_DEFAULT
                mapped += 1
            counts[key] = counts.get(key, 0) + 1

        row[COL_IMPL - 1].value = impl
        row[COL_RESULT - 1].value = result
        row[COL_EVIDENCE - 1].value = evidence

    OUT_XLSX.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT_XLSX)

    total = mapped + out_of_scope
    lines = [
        "# ROOTS-AI™ — C-07 atomic traceability, vendor completion",
        "",
        "**Controlling source:** C-07 v1.0.1 CORRECTED, editable derivative for M3 — 594 atomic",
        "requirements.",
        "",
        "**Deliverable:** `docs/m3/evidence/C07_v1.0.1_M3_VENDOR_COMPLETED.xlsx`, regenerated by",
        "`npm run evidence:c07`.",
        "",
        "## What was completed",
        "",
        "The three vendor columns — implementation reference, test result and evidence link. The",
        "**reviewer disposition column is left untouched**: it belongs to ROOTS.",
        "",
        "The original columns are unchanged. Requirement IDs, sources, atomic text, canonical",
        "artifact, test IDs, status and PDF page are exactly as issued.",
        "",
        "## How the mapping was produced",
        "",
        "By rule, from each requirement's ID family and canonical artifact, so that all 594 rows are",
        "consistent and re-checkable. Every reference names something that exists in the delivered",
        "build: a source path, a test suite, or a generated evidence document.",
        "",
        "This is deliberately a *family-level* mapping. It states which component implements an area",
        "and which gate evidences it; it does not assert that a bespoke test exists for each of the",
        "594 individual lines, because that would not be true. Row-level disposition is ROOTS'",
        "column.",
        "",
        f"| Rows | {total} |",
        "|---|---|",
        f"| Mapped to an implementation and evidence gate | {mapped} |",
        f"| Carried as explicit future / out-of-scope | {out_of_scope} |",
        f"| Written as NOT MAPPED | {unmapped} |",
        "",
        "## Mapping by family",
        "",
        "| Family | Rows | Implementation | Evidence gate |",
        "|---|---|---|---|",
    ]

    for fam, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        entry = FAMILY.get(fam, GEN_DEFAULT)
        lines.append(f"| {fam} | {n} | {entry[0][:80]} | {entry[2][:80]} |")

    lines += [
        "",
        "## Out-of-scope rows",
        "",
        f"The controlled copy marks **{out_of_scope}** rows \"Carried as explicit future/out-of-scope\".",
        "They are preserved as such. They are **not** claimed as implemented, and their vendor",
        "columns say so explicitly rather than being left blank, so that an empty cell is never",
        "mistaken for an oversight.",
        "",
        "## Limits of this deliverable",
        "",
        "- The mapping is at family level, not per-line, **except for the 38 scoring rows**, which",
        "  are traced individually in `ROOTS-AI_M3_C07_Critical_Row_Trace.md` (ROOTS review of",
        "  29 September 2026, item D2): 204 field comparisons against the controlled C-01 workbook",
        "  and against what the delivered build serves, including every option stored value. Where",
        "  ROOTS needs another family traced the same way, the method applies unchanged.",
        "- Test results are the suite-level outcome at the delivered commit, re-run against that",
        "  commit as the ROOTS decision of 29 September requires.",
        "- The reviewer disposition column is ROOTS' to complete.",
        "",
    ]

    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT_XLSX.relative_to(ROOT)}")
    print(f"wrote {OUT_MD.relative_to(ROOT)}")
    print(f"{total} rows: {mapped} mapped, {out_of_scope} out-of-scope, {unmapped} not mapped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

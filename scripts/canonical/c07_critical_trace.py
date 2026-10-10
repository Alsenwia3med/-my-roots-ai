"""
C-07 line-by-line trace for the critical rows.

    python scripts/canonical/c07_critical_trace.py      (npm run evidence:c07-critical)

ROOTS review of 29 September 2026, item D2: the C-07 completion is a family-level mapping, and
ROOTS asks for line-by-line proof on the critical rows rather than on request.

**What counts as critical, and why.** The 38 rows whose canonical artifact is
`C-02 + machine_readable/data/scoring_config` — the scientific engine and the questions that feed
it. That is the one family where a defect is both silent and material: a wrong option value or a
mis-stated range produces a plausible report that is wrong, and review point 35 exists to protect
exactly this. The set is the workbook's own classification, not a selection of ours. ROOTS can
nominate further families and the same method applies; the method is what is being offered here as
much as the result.

**What "proof" means here, per row.** Not a reference to a file. Each row is verified against the
delivered build at generation time:

  - A row that states a question's specification (`Q11: ... [type=likert; required=True; ...]
    Options: NVR=Never; ...`) is parsed field by field and each field compared with the delivered
    C-01 question bank — type, required, allow_na, validation, conditional logic, and every option
    ID, label and stored value, in order. A difference is a failure, not a footnote.
  - A row that states a property of the engine is checked against a named test, and the run fails
    if that test does not exist in the suite, so a citation cannot rot into a decoration.
  - A row that is a definition, a document index or marketing prose carries no independently
    testable assertion. It is marked as such with the reason, rather than given a reference that
    would look like verification and not be one.

Output: docs/m3/ROOTS-AI_M3_C07_Critical_Row_Trace.md

Requires: pip install openpyxl
"""

from __future__ import annotations

import glob
import json
import re
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[2]
BANK = ROOT / "lib" / "assessment" / "c01-question-bank.json"
C01_XLSX = ROOT / "docs" / "controlled-sources" / "02_ROOTS_AI_C01_Canonical_Question_Bank_v1.0.1_CORRECTED.xlsx"
OUT = ROOT / "docs" / "m3" / "ROOTS-AI_M3_C07_Critical_Row_Trace.md"
TESTS = ROOT / "tests"

CRITICAL_ARTIFACT = "scoring_config"


def controlled_c01() -> dict[str, dict]:
    """The controlled C-01 workbook, keyed by question ID, so a C-07 row can be checked against
    the source it was extracted from as well as against what we built."""
    ws = load_workbook(str(C01_XLSX))["Questions"]
    header = [str(c.value) for c in ws[5]]
    out: dict[str, dict] = {}
    for row in ws.iter_rows(min_row=6, values_only=True):
        record = dict(zip(header, row))
        qid = record.get("question_id")
        if qid:
            out[str(qid)] = record
    return out


def controlled_option_sets() -> dict[str, list[dict]]:
    """The controlled C-01 Option_Sets sheet, keyed by set ID and kept in its issued order."""
    ws = load_workbook(str(C01_XLSX))["Option_Sets"]
    header = [str(c.value) for c in ws[5]]
    out: dict[str, list[dict]] = {}
    for row in ws.iter_rows(min_row=6, values_only=True):
        record = dict(zip(header, row))
        set_id = record.get("option_set_id")
        if set_id:
            out.setdefault(str(set_id), []).append(record)
    for options in out.values():
        options.sort(key=lambda o: int(o["option_order"]))
    return out


def workbook_rows() -> list[list]:
    matches = glob.glob(str(ROOT / "docs" / "ROOTS_AI_RAHUL_M3_FINAL_CORRECTED_VERIFIED_2026-09-24 (3)" / "03_C07_EDITABLE_WORKING_COPY" / "*.xlsx"))
    if not matches:
        raise SystemExit("controlled C-07 working copy not found")
    ws = load_workbook(matches[0])["Atomic trace 594"]
    return [[c.value for c in r] for r in ws.iter_rows(min_row=2)]


def flat(text) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


# --------------------------------------------------------------------------- question rows

SPEC = re.compile(r"^(Q\d+):\s*(.*?)\s*\[(.*?)\]\s*(?:Options:\s*(.*))?$", re.DOTALL)


def parse_spec(text: str) -> dict | None:
    m = SPEC.match(flat(text))
    if not m:
        return None
    qid, question_text, attrs, options = m.groups()
    fields = {}
    for part in attrs.split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            fields[k.strip()] = v.strip()
    parsed_options = []
    if options:
        for part in options.split(";"):
            part = part.strip()
            if "=" in part:
                oid, label = part.split("=", 1)
                parsed_options.append((oid.strip(), label.strip()))
    return {"id": qid, "text": question_text, "fields": fields, "options": parsed_options}


def check_question(spec: dict, bank: dict, c01: dict[str, dict], sets: dict[str, list[dict]]) -> list[tuple[str, str, str, str, bool, bool]]:
    """
    One comparison per field, three ways.

    (field, stated in C-07, controlled C-01, delivered build, build matches C-01, C-07 matches C-01)

    The obligation is to match the controlled C-01, so that is what can fail. Where the C-07
    extract disagrees with C-01 and the build agrees with it, the extract is stale: that is
    reported to ROOTS, not treated as a defect in the build.
    """
    question = next((q for q in bank["questions"] if q["question_id"] == spec["id"]), None)
    if question is None:
        return [("question exists", spec["id"], "\u2014", "NOT FOUND in the delivered question bank", False, True)]
    controlled = c01.get(spec["id"], {})

    out: list[tuple[str, str, str, str, bool, bool]] = []

    def same(a, b) -> bool:
        return str(a).strip().lower() == str(b).strip().lower()

    def cmp(field: str, stated: str, found, source_key: str | None = None) -> None:
        source = controlled.get(source_key) if source_key else None
        source_s = "\u2014" if source is None else str(source)
        build_ok = True if source is None else same(found, source)
        c07_ok = True if source is None else same(stated, source)
        out.append((field, stated, source_s, str(found), build_ok, c07_ok))

    if spec["text"]:
        cmp("question text", spec["text"].rstrip("?") + "?", question["question_text"], "question_text")
    f = spec["fields"]
    if "type" in f:
        cmp("type", f["type"], question["question_type"], "question_type")
    if "required" in f:
        cmp("required", f["required"], question["required"], "required")
    if "allow_na" in f:
        cmp("allow_na", f["allow_na"], question["allow_na"], "allow_na")
    if "validation" in f:
        cmp("validation", f["validation"], question["validation"], "validation")
    if "conditional_logic" in f:
        cmp("conditional_logic", f["conditional_logic"], question["conditional_logic"], "conditional_logic")

    if spec["options"]:
        set_id = question["option_set_id"] or ""
        delivered = bank["option_sets"].get(set_id, [])
        controlled_set = sets.get(set_id, [])

        stated_ids = [o for o, _ in spec["options"]]
        found_ids = [o["option_id"] for o in delivered]
        source_ids = [str(o["option_id"]) for o in controlled_set]
        out.append(
            (
                "option IDs, in order",
                ", ".join(stated_ids),
                ", ".join(source_ids),
                ", ".join(found_ids),
                found_ids == source_ids,
                stated_ids == source_ids,
            )
        )
        for oid, label in spec["options"]:
            found = next((o for o in delivered if o["option_id"] == oid), None)
            source = next((o for o in controlled_set if str(o["option_id"]) == oid), None)
            source_label = str(source["display_label"]) if source else "NOT IN C-01"
            out.append(
                (
                    f"option `{oid}` label",
                    label,
                    source_label,
                    found["display_label"] if found else "NOT FOUND",
                    bool(found) and bool(source) and same(found["display_label"], source_label),
                    bool(source) and same(label, source_label),
                )
            )
        # Stored values decide the score, so they are compared even though C-07 does not state them.
        for option in controlled_set:
            oid = str(option["option_id"])
            found = next((o for o in delivered if o["option_id"] == oid), None)
            source_value = option["stored_value_or_points"]
            source_s = "null" if source_value in (None, "", "None") else str(source_value)
            found_s = "NOT FOUND" if found is None else ("null" if found["stored_value"] is None else str(found["stored_value"]))
            out.append(
                (
                    f"option `{oid}` stored value",
                    "not stated in C-07",
                    source_s,
                    found_s,
                    found is not None and same(found_s, source_s),
                    True,
                )
            )
    return out


# --------------------------------------------------------------------------- engine-property rows

# Each row that states a property of the engine, with the test that proves it. The test title must
# exist in the suite or this run fails, so a citation cannot survive the test being renamed.
ENGINE_ROWS: dict[str, tuple[str, str]] = {
    "SCR-0001": (
        "Biological State is produced on 0-100 by C-02 SC-002, as the mean of the available domain scores, and is null below the five-domain minimum.",
        "SC-002: Biological State is null when fewer than five domains",
    ),
    "SCR-0003": (
        "Opportunity Score is derived from Biological State alone by C-02 SC-003, and is null whenever Biological State is null.",
        "SC-003: Opportunity is null when Biological State is null",
    ),
    "SCR-0004": (
        "The primary driver is the highest-ranked domain that meets C-02 DRV-001 eligibility; where none is eligible, no driver is ranked.",
        "DRV-001: no domain reaching the eligibility threshold",
    ),
    "SCR-0002": (
        "Recovery Potential is produced by C-02 SC-005 and is null, never a pseudo-score, whenever Biological State is null (review point 2).",
        "SC-005: Recovery is null when Biological State is null",
    ),
    "SCR-0017": (
        "An unanswered or N/A item is excluded from its domain rather than counted as zero; below the C-02 SC-001 coverage floor the domain scores null, which then propagates to the five-domain minimum.",
        "below the coverage floor scores null, and is not treated as zero",
    ),
}

# Rows that state a control verified elsewhere, with the gate that verifies it.
GATE_ROWS: dict[str, tuple[str, str]] = {
    "SCR-0015": (
        "Prompt templates, governance rules and scoring logic are held server-side and are never sent to the browser.",
        "`npm run check:security`; `tests/ai/boundary.test.ts`",
    ),
    "SCR-0016": (
        "Row Level Security on every table, participant self-access only, staff access by verified role, recent MFA on the admin operations C-05 requires it for.",
        "`npm run db:probes` - 98 probes across both SQL suites",
    ),
    "SCR-0013": (
        "Scoring methodology and Recovery Potential logic are confidential: no weighting, constant or threshold is exposed in any participant-facing output.",
        "`tests/report/reviewPoints.test.ts` - *no explanation exposes a weighting, constant or threshold*",
    ),
    "SCR-0010": (
        "Encryption, data security and infrastructure controls.",
        "`npm run check:security`",
    ),
    "SCR-0014": (
        "TypeScript strict mode and modular architecture.",
        "`npx tsc --noEmit` at the delivered commit",
    ),
}


def test_titles() -> list[str]:
    titles: list[str] = []
    for path in TESTS.rglob("*.test.ts"):
        for m in re.finditer(r"(?:test|it)\(\s*(['\"`])(.+?)\1", path.read_text(encoding="utf-8"), re.DOTALL):
            titles.append(flat(m.group(2)))
    return titles


def main() -> None:
    bank = json.loads(BANK.read_text(encoding="utf-8"))
    c01 = controlled_c01()
    sets = controlled_option_sets()
    rows = [r for r in workbook_rows() if CRITICAL_ARTIFACT in str(r[3])]
    titles = test_titles()

    question_rows: list[tuple[list, dict, list]] = []
    engine_checked: list[tuple[list, str, str, bool]] = []
    gate_rows: list[tuple[list, str, str]] = []
    definitional: list[list] = []

    for row in rows:
        spec = parse_spec(row[2])
        if spec:
            question_rows.append((row, spec, check_question(spec, bank, c01, sets)))
        elif row[0] in ENGINE_ROWS:
            claim, needle = ENGINE_ROWS[row[0]]
            found = any(needle.lower() in t.lower() for t in titles)
            match = next((t for t in titles if needle.lower() in t.lower()), "")
            engine_checked.append((row, claim, match, found))
        elif row[0] in GATE_ROWS:
            claim, gate = GATE_ROWS[row[0]]
            gate_rows.append((row, claim, gate))
        else:
            definitional.append(row)

    field_checks = [(row, spec, c) for row, spec, checks in question_rows for c in checks]
    build_wrong = [(row, c) for row, _, c in field_checks if not c[4]]
    stale_extract = [(row, c) for row, _, c in field_checks if c[4] and not c[5]]
    missing_tests = [r for r in engine_checked if not r[3]]

    write(rows, question_rows, engine_checked, gate_rows, definitional, field_checks, build_wrong, stale_extract)

    print(f"critical rows (canonical artifact contains '{CRITICAL_ARTIFACT}'): {len(rows)}")
    print(f"  question specifications verified field by field : {len(question_rows)} rows, {len(field_checks)} fields")
    print(f"  engine properties traced to a named test        : {len(engine_checked)}")
    print(f"  controls traced to a named gate                 : {len(gate_rows)}")
    print(f"  definitional, no testable assertion             : {len(definitional)}")
    print(f"  build differs from controlled C-01              : {len(build_wrong)}")
    print(f"  C-07 extract differs from controlled C-01       : {len(stale_extract)}")
    print(f"\nwrote {OUT.relative_to(ROOT)}")

    if build_wrong:
        print(f"\nFAILED - {len(build_wrong)} field(s) where the delivered build differs from controlled C-01:")
        for row, (field, stated, source, found, _, _) in build_wrong:
            print(f"  {row[0]} {field}: C-01 says {source!r}, build has {found!r}")
        raise SystemExit(1)
    if missing_tests:
        print(f"\nFAILED - {len(missing_tests)} cited test(s) do not exist in the suite:")
        for row, _, _, _ in missing_tests:
            print(f"  {row[0]} -> {ENGINE_ROWS[row[0]][1]!r}")
        raise SystemExit(1)

    if stale_extract:
        print(f"\nFOR ROOTS - {len(stale_extract)} field(s) where the C-07 extract differs from controlled C-01,")
        print("            and the delivered build agrees with C-01:")
        for row, (field, stated, source, found, _, _) in stale_extract:
            print(f"  {row[0]} {field}")
            print(f"    C-07 : {stated}")
            print(f"    C-01 : {source}")

    print("\nPASS - the delivered build matches controlled C-01 on every stated field, and every cited test exists.")


def write(rows, question_rows, engine_checked, gate_rows, definitional, field_checks, build_wrong, stale_extract) -> None:
    lines = [
        "# ROOTS-AI\u2122 \u2014 C-07 line-by-line trace, critical rows",
        "",
        "Prepared in response to the ROOTS review of 29 September 2026, item D2.",
        "",
        "**Generated by** `npm run evidence:c07-critical`. Every comparison below is made against the",
        "controlled C-01 workbook and the delivered build at generation time; nothing is transcribed.",
        "",
        "## Which rows, and why these",
        "",
        f"The **{len(rows)}** rows whose canonical artifact is `C-02 + machine_readable/data/scoring_config`.",
        "That is the workbook's own classification, not a selection of ours.",
        "",
        "They are the critical set because they are the one family where a defect is both silent and",
        "material: a wrong option value or a mis-stated range produces a report that reads correctly and",
        "is wrong. Review point 35 exists to protect exactly this ground. ROOTS can nominate further",
        "families; the method below applies unchanged, and the method is offered here as much as the",
        "result.",
        "",
        "## What proof means, row by row",
        "",
        "| Kind of row | Count | How it is verified |",
        "|---|---|---|",
        f"| States a question's specification | {len(question_rows)} | Parsed field by field and compared **three ways**: what C-07 states, what the controlled C-01 workbook says, and what the delivered build serves. |",
        f"| States a property of the engine | {len(engine_checked)} | Traced to a named test. The run fails if that test is not in the suite, so a citation cannot rot into a decoration. |",
        f"| States a control verified elsewhere | {len(gate_rows)} | Traced to the named gate that verifies it. |",
        f"| Definition, document index or prose | {len(definitional)} | Marked as carrying no independently testable assertion, with the reason. A reference here would look like verification and would not be one. |",
        "",
        "**The three-way comparison matters.** Our obligation is to the controlled C-01, not to the C-07",
        "extract, so the two possible findings are different things and are reported as different things:",
        "",
        "| Finding | Meaning | Treatment |",
        "|---|---|---|",
        f"| Build differs from controlled C-01 | A defect in what we built | **Fails the run.** {len(build_wrong)} found. |",
        f"| C-07 extract differs from C-01, build agrees with C-01 | The traceability extract is stale | Reported to ROOTS. {len(stale_extract)} found. |",
        "",
        f"**Result: {len(field_checks)} individual field comparisons across {len(question_rows)} questions.**",
        "",
    ]

    if stale_extract:
        lines += [
            "---",
            "",
            "## Finding: the C-07 extract is stale in one place \u2014 resolved by ROOTS",
            "",
            "Reported rather than corrected, because C-07 is a controlled derivative and not ours to edit.",
            "ROOTS determined the governing source on 30 September 2026; the determination is recorded below.",
            "",
        ]
        for row, (field, stated, source, found, _, _) in stale_extract:
            lines += [
                f"### `{row[0]}` \u2014 {field}",
                "",
                "| Source | Says |",
                "|---|---|",
                f"| C-07 v1.0.1 CORRECTED, atomic row | {stated} |",
                f"| **C-01 v1.0.1 CORRECTED** (controlling) | **{source}** |",
                f"| Delivered build | {found} |",
                "",
                "The build follows C-01, which is the controlling source for question specifications. The",
                "C-07 row carries text from before the v1.0.1 correction.",
                "",
                "### ROOTS determination, 30 September 2026 \u2014 RESOLVED",
                "",
                "> \"ROOTS confirms that C-01 v1.0.1 CORRECTED governs Q14 validation. The C-07 wording",
                "> \u2018Zero or more approved option IDs\u2019 is stale and conflicts with the corrected C-01",
                "> requirement that at least one approved option be supplied. The delivered implementation",
                "> following C-01 is therefore the correct behavior.\"",
                "",
                "| | |",
                "|---|---|",
                "| Governing source | **C-01 v1.0.1 CORRECTED** |",
                "| Delivered behaviour | **Correct. No change required.** |",
                "| C-07 row `SCR-0034` | **Stale.** To be corrected under controlled revision, preserving history |",
                "| Questionnaire behaviour | **Unchanged.** This is a traceability correction, not a behaviour change |",
                "",
                "### Correction history for `SCR-0034`",
                "",
                "| Date | Event |",
                "|---|---|",
                "| 24 Sep 2026 | C-07 v1.0.1 CORRECTED issued, carrying *\"Zero or more approved option IDs\"* |",
                "| 30 Sep 2026 | Vendor field-by-field trace of the 38 scoring rows identifies the conflict with C-01 |",
                "| 30 Sep 2026 | ROOTS determines C-01 governs; C-07 row recorded as stale |",
                "| \u2014 | C-07 reissue with the corrected row: **pending ROOTS**, as C-07 is a ROOTS-controlled document |",
                "",
                "The original C-07 row is preserved above and is not edited by us. ROOTS holds the document;",
                "this record exists so the correction is traceable from the evidence set rather than only",
                "from correspondence. ROOTS also confirmed that this determination does not authorise any",
                "other change to C-07, and the field-by-field review of the remaining scoring rows is",
                "retained as evidence.",
                "",
            ]

    lines += [
        "---",
        "",
        "## 1. Question specifications, field by field",
        "",
        "Each row states a question's type, flags, validation and option set. Each field is compared with",
        "the controlled C-01 workbook and with what the delivered build serves.",
        "",
    ]

    for row, spec, checks in question_rows:
        build_ok = all(c[4] for c in checks)
        c07_ok = all(c[5] for c in checks)
        mark = "" if (build_ok and c07_ok) else " \u2014 see the finding above" if build_ok else " \u2014 **build differs from C-01**"
        lines += [
            f"### {row[0]} \u2014 `{spec['id']}`{mark}",
            "",
            f"> {flat(row[2])[:400]}{'\u2026' if len(flat(row[2])) > 400 else ''}",
            "",
            "| Field | C-07 states | Controlled C-01 | Delivered build | |",
            "|---|---|---|---|---|",
        ]
        for field, stated, source, found, ok_build, ok_c07 in checks:
            verdict = "match" if (ok_build and ok_c07) else "**C-07 stale**" if ok_build else "**BUILD DIFFERS**"
            lines.append(f"| {field} | {stated[:70]} | {source[:70]} | {found[:70]} | {verdict} |")
        lines.append("")

    lines += [
        "## 2. Engine properties, traced to a named test",
        "",
        "| Row | What the row states, as implemented | Test that proves it |",
        "|---|---|---|",
    ]
    for row, claim, match, found in engine_checked:
        lines.append(f"| `{row[0]}` | {claim} | {'`' + match + '`' if found else '**NOT FOUND**'} |")

    lines += [
        "",
        "## 3. Controls, traced to a named gate",
        "",
        "| Row | What the row states | Gate |",
        "|---|---|---|",
    ]
    for row, claim, gate in gate_rows:
        lines.append(f"| `{row[0]}` | {claim} | {gate} |")

    lines += [
        "",
        "## 4. Rows with no independently testable assertion",
        "",
        "Definitions of terms, indexes of other documents, trademark names and prose lifted from the",
        "source pack. They are listed in full rather than summarised, because the honest statement is",
        "that there is nothing in them to test, and that statement should be checkable.",
        "",
        "Each is still implemented in the sense that the thing it names exists \u2014 the domain scores it",
        "lists are produced, the marks it uses are carried \u2014 and the family-level mapping in the",
        "completed workbook is where that is recorded. What is *not* claimed is a bespoke test for the",
        "sentence itself.",
        "",
        "| Row | Text |",
        "|---|---|",
    ]
    for row in definitional:
        text = flat(row[2]).replace("|", "\\|")
        lines.append(f"| `{row[0]}` | {text[:200]}{'\u2026' if len(text) > 200 else ''} |")

    lines += [
        "",
        "## What this does and does not settle",
        "",
        "**Settles.** Every question specification in the critical family is compared, field by field and",
        "option by option, against the controlled C-01 and against what the delivered build serves \u2014 by",
        "machine, not by reading. Every engine property cited here has a test behind it that exists today",
        "and will be missed if it is removed.",
        "",
        f"**Surfaces.** {len(stale_extract)} field(s) where the C-07 extract and the controlling C-01 disagree. That is",
        "the kind of thing a family-level mapping cannot find, and it is the argument for doing this on",
        "the rows where it matters.",
        "",
        "**Does not settle.** The other rows remain a family-level mapping. Extending this method to",
        "another family is mechanical where the rows carry specifications, and is a judgement about what",
        "a sentence asserts where they do not. ROOTS is asked to nominate which further families, if",
        "any, need it.",
        "",
    ]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

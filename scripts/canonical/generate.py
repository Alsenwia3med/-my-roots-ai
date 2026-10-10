"""
Generates the application's canonical data files from the controlled executable workbooks
(ROOTS request, M2 item 10: generated JSON must reproduce the controlled XLSX sources without
manual reinterpretation and identify the exact source version).

    python scripts/canonical/generate.py          # regenerate
    python scripts/canonical/generate.py --check  # fail if the committed JSON differs

Inputs (docs/controlled-sources/):
    02_ROOTS_AI_C01_Canonical_Question_Bank_v1.0.1_CORRECTED.xlsx
    03_ROOTS_AI_C02_Canonical_Scoring_Rules_and_Golden_Tests_v1.0.1_CORRECTED.xlsx

Outputs:
    lib/assessment/c01-question-bank.json   modules, option sets, 73 questions, validation rules
    lib/scoring/c02-ruleset.json            domains, 40-item mapping, option points, formulas,
                                            protective factors, classifications, driver rules
    lib/scoring/c02-golden-tests.json       the 30 golden cases, input and expected output

Every value is copied from the workbook cell as stored. The only transformations are type
normalisation (Excel booleans/"True" -> true, whole-number floats -> integers, blank -> null)
and JSON parsing of the golden-test cells, which the workbook stores as JSON text. Each output
records the source file name and its SHA-256, so a build can be traced to the exact workbook.

Requires: pip install openpyxl
"""

import hashlib
import json
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "controlled-sources"
C01 = SRC / "02_ROOTS_AI_C01_Canonical_Question_Bank_v1.0.1_CORRECTED.xlsx"
C02 = SRC / "03_ROOTS_AI_C02_Canonical_Scoring_Rules_and_Golden_Tests_v1.0.1_CORRECTED.xlsx"
OUT_BANK = ROOT / "lib" / "assessment" / "c01-question-bank.json"
OUT_RULES = ROOT / "lib" / "scoring" / "c02-ruleset.json"
OUT_GOLDEN = ROOT / "lib" / "scoring" / "c02-golden-tests.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def norm(v):
    """Excel cell value -> JSON value, without changing its meaning."""
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    if isinstance(v, float) and v.is_integer():
        return int(v)
    if isinstance(v, str):
        s = v.strip()
        if s == "":
            return None
        if s in ("True", "TRUE"):
            return True
        if s in ("False", "FALSE"):
            return False
        return s
    return v


def table(ws, header_row: int):
    """Rows below the header row as dicts keyed by the header cells. Stops at the first blank row."""
    rows = list(ws.iter_rows(values_only=True))
    header = [norm(h) for h in rows[header_row - 1]]
    out = []
    for r in rows[header_row:]:
        if all(norm(c) is None for c in r):
            break
        out.append({h: norm(c) for h, c in zip(header, r) if h is not None})
    return out


def find_header(ws, first_col: str) -> int:
    for i, r in enumerate(ws.iter_rows(values_only=True), start=1):
        if norm(r[0]) == first_col:
            return i
    raise SystemExit(f"{ws.title}: header '{first_col}' not found")


def sheet(wb, name, first_col):
    ws = wb[name]
    return table(ws, find_header(ws, first_col))


def readme(wb):
    return {r["Field"]: r["Value"] for r in sheet(wb, "README", "Field")}


def source(path: Path, doc_version: str):
    return {"document": path.name, "document_version": doc_version, "sha256": sha256(path)}


# ---------------------------------------------------------------- C-01
def build_bank():
    wb = openpyxl.load_workbook(C01, data_only=True)
    meta = readme(wb)
    modules = sheet(wb, "Modules", "module_id")
    option_rows = sheet(wb, "Option_Sets", "option_set_id")
    questions = sheet(wb, "Questions", "questionnaire_version")
    validation = sheet(wb, "Validation", "rule_id")
    qa = sheet(wb, "QA_Checks", "Check")

    option_sets = {}
    for r in option_rows:
        option_sets.setdefault(r["option_set_id"], []).append({
            "option_order": r["option_order"],
            "option_id": r["option_id"],
            "display_label": r["display_label"],
            "stored_value": r["stored_value_or_points"],
            "is_na": bool(r["is_na"]),
        })

    versions = {q["questionnaire_version"] for q in questions}
    if len(versions) != 1:
        raise SystemExit(f"C-01: questions carry more than one questionnaire_version: {versions}")

    return {
        "dataset_id": meta["Dataset ID"],
        "questionnaire_version": str(meta["questionnaire_version"]),
        "language": "en",
        "source": source(C01, "1.0.1 CORRECTED"),
        "clinical_boundary": "This proprietary beta wellness assessment is educational and non-diagnostic; it is not represented as a clinically validated diagnostic instrument.",
        "required_response_rule": meta.get("Required-response rule"),
        "modules": [
            {k: m[k] for k in ("module_id", "module_order", "module_title", "purpose", "question_range")}
            for m in modules
        ],
        "option_sets": option_sets,
        "questions": [
            {
                "question_id": q["question_id"],
                "question_order": q["question_order"],
                "module_id": q["module_id"],
                "question_text": q["question_text"],
                "question_type": q["question_type"],
                "option_set_id": q["option_set_id"],
                "required": bool(q["required"]),
                "allow_na": bool(q["allow_na"]),
                "validation": q["validation"],
                "scoring_eligible": bool(q["scoring_eligible"]),
                "conditional_logic": q["conditional_logic"],
                "help_text": q["help_text"],
                "status": q["status"],
            }
            for q in questions
        ],
        "validation_rules": validation,
        "qa_checks": qa,
    }


# ---------------------------------------------------------------- C-02
def build_rules():
    wb = openpyxl.load_workbook(C02, data_only=True)
    meta = readme(wb)
    golden_rows = sheet(wb, "Golden_Tests", "test_id")
    rules = {
        "dataset_id": meta["Dataset ID"],
        "scoring_version": str(meta["scoring_version"]),
        "source": source(C02, "1.0.1 CORRECTED"),
        "readme": meta,
        "domains": sheet(wb, "Domains", "domain_id"),
        "question_mapping": sheet(wb, "Question_Mapping", "question_id"),
        "option_points": sheet(wb, "Option_Points", "question_id"),
        "formulas": sheet(wb, "Formulas", "rule_id"),
        "protective_factors": sheet(wb, "Protective_Factors", "factor_id"),
        "classifications": sheet(wb, "Classifications", "scale"),
        "drivers_evidence": sheet(wb, "Drivers_Evidence", "rule_id"),
        "qa_checks": sheet(wb, "QA_Checks", "Check"),
    }
    golden = {
        "dataset_id": meta["Dataset ID"],
        "scoring_version": str(meta["scoring_version"]),
        "source": source(C02, "1.0.1 CORRECTED"),
        "note": "Inputs are normalized burden points after option mapping; null = N/A or missing. Expected outputs must match exactly.",
        "cases": [
            {
                "test_id": g["test_id"],
                "purpose": g["purpose"],
                "input": json.loads(g["normalized_input_json"]),
                "expected": json.loads(g["expected_output_json"]),
            }
            for g in golden_rows
        ],
    }
    return rules, golden


def dump(obj) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False) + "\n"


def main():
    check = "--check" in sys.argv
    bank = build_bank()
    rules, golden = build_rules()
    outputs = {OUT_BANK: dump(bank), OUT_RULES: dump(rules), OUT_GOLDEN: dump(golden)}
    stale = []
    for path, text in outputs.items():
        if check:
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                stale.append(path.relative_to(ROOT).as_posix())
        else:
            path.write_text(text, encoding="utf-8", newline="\n")
            print(f"wrote {path.relative_to(ROOT).as_posix()}")
    if check:
        if stale:
            raise SystemExit("out of date with the controlled workbooks: " + ", ".join(stale))
        print("canonical JSON matches the controlled workbooks")


if __name__ == "__main__":
    main()

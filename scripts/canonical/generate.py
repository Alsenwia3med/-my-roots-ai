#!/usr/bin/env python3
"""
Generate canonical assessment data from C-01 Excel workbook.
This script reads the controlled C-01 workbook and generates JSON files
for the application to use.
"""

import json
import hashlib
import sys
from pathlib import Path
from typing import Dict, List, Any
import openpyxl

def calculate_sha256(file_path: str) -> str:
    """Calculate SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def read_workbook(file_path: str) -> openpyxl.Workbook:
    """Read the Excel workbook."""
    return openpyxl.load_workbook(file_path, data_only=True)

def extract_modules(sheet) -> List[Dict[str, Any]]:
    """Extract module information from the Modules sheet."""
    modules = []
    header_row = None

    for idx, row in enumerate(sheet.iter_rows(values_only=True)):
        if row and 'module_id' in [str(cell) if cell else '' for cell in row]:
            header_row = idx
            break

    if header_row is None:
        raise ValueError("Module header row not found")

    headers = list(sheet.iter_rows(min_row=header_row + 1, max_row=header_row + 1, values_only=True))[0]
    headers = [h.strip().lower().replace(' ', '_') if h else '' for h in headers]

    for row in sheet.iter_rows(min_row=header_row + 2, values_only=True):
        if not row[0]:
            continue

        module = {}
        for idx, value in enumerate(row):
            if idx < len(headers) and headers[idx]:
                module[headers[idx]] = value

        if module:
            modules.append(module)

    return modules

def extract_questions(sheet) -> List[Dict[str, Any]]:
    """Extract question information from the Questions sheet."""
    questions = []
    header_row = None

    for idx, row in enumerate(sheet.iter_rows(values_only=True)):
        if row and 'question_id' in [str(cell) if cell else '' for cell in row]:
            header_row = idx
            break

    if header_row is None:
        raise ValueError("Question header row not found")

    headers = list(sheet.iter_rows(min_row=header_row + 1, max_row=header_row + 1, values_only=True))[0]
    headers = [h.strip().lower().replace(' ', '_') if h else '' for h in headers]

    for row in sheet.iter_rows(min_row=header_row + 2, values_only=True):
        if not row[0]:
            continue

        question = {}
        for idx, value in enumerate(row):
            if idx < len(headers) and headers[idx]:
                question[headers[idx]] = value

        if question:
            questions.append(question)

    return questions

def extract_option_sets(sheet) -> Dict[str, List[Dict[str, Any]]]:
    """Extract option sets from the Option_Sets sheet."""
    option_sets = {}
    header_row = None

    for idx, row in enumerate(sheet.iter_rows(values_only=True)):
        if row and 'option_set_id' in [str(cell) if cell else '' for cell in row]:
            header_row = idx
            break

    if header_row is None:
        raise ValueError("Option set header row not found")

    headers = list(sheet.iter_rows(min_row=header_row + 1, max_row=header_row + 1, values_only=True))[0]
    headers = [h.strip().lower().replace(' ', '_') if h else '' for h in headers]

    current_set_id = None
    current_options = []

    for row in sheet.iter_rows(min_row=header_row + 2, values_only=True):
        if not row[0]:
            if current_set_id and current_options:
                option_sets[current_set_id] = current_options
                current_set_id = None
                current_options = []
            continue

        option = {}
        for idx, value in enumerate(row):
            if idx < len(headers) and headers[idx]:
                option[headers[idx]] = value

        if option.get('option_set_id') != current_set_id:
            if current_set_id and current_options:
                option_sets[current_set_id] = current_options
            current_set_id = option.get('option_set_id')
            current_options = []

        if option:
            current_options.append(option)

    if current_set_id and current_options:
        option_sets[current_set_id] = current_options

    return option_sets

def extract_validation_rules(sheet) -> List[Dict[str, Any]]:
    """Extract validation rules from the Validation sheet."""
    validation_rules = []
    header_row = None

    for idx, row in enumerate(sheet.iter_rows(values_only=True)):
        if row and 'rule_id' in [str(cell) if cell else '' for cell in row]:
            header_row = idx
            break

    if header_row is None:
        raise ValueError("Validation header row not found")

    headers = list(sheet.iter_rows(min_row=header_row + 1, max_row=header_row + 1, values_only=True))[0]
    headers = [h.strip().lower().replace(' ', '_') if h else '' for h in headers]

    for row in sheet.iter_rows(min_row=header_row + 2, values_only=True):
        if not row[0]:
            continue

        rule = {}
        for idx, value in enumerate(row):
            if idx < len(headers) and headers[idx]:
                rule[headers[idx]] = value

        if rule:
            validation_rules.append(rule)

    return validation_rules

def main():
    workbook_path = r"c:\Users\user\Downloads\02_ROOTS_AI_C01_Canonical_Question_Bank_v1.0.1_CORRECTED.xlsx"
    output_dir = Path("C:/Users/user/Desktop/works/2026/RootsAi/my-roots-ai/src/lib/assessment")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Calculate SHA-256
    sha256 = calculate_sha256(workbook_path)
    print(f"Workbook SHA-256: {sha256}")

    # Read workbook
    wb = read_workbook(workbook_path)

    # Extract data
    modules = extract_modules(wb['Modules'])
    questions = extract_questions(wb['Questions'])
    option_sets = extract_option_sets(wb['Option_Sets'])
    validation_rules = extract_validation_rules(wb['Validation'])

    # Build complete question bank
    question_bank = {
        "metadata": {
            "document": "C-01 v1.0.1 CORRECTED",
            "questionnaire_version": "1.0.0",
            "sha256": sha256,
            "generated_at": "2026-10-02"
        },
        "modules": modules,
        "questions": questions,
        "option_sets": option_sets,
        "validation_rules": validation_rules
    }

    # Write output
    output_file = output_dir / "c01-question-bank.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(question_bank, f, indent=2, ensure_ascii=False)

    print(f"Generated {output_file}")
    print(f"Modules: {len(modules)}")
    print(f"Questions: {len(questions)}")
    print(f"Option Sets: {len(option_sets)}")
    print(f"Validation Rules: {len(validation_rules)}")

if __name__ == "__main__":
    main()

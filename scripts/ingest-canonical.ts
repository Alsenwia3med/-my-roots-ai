/**
 * ROOTS-AI(TM) M2 - Controlled source ingestion (contractual requirement 10).
 *
 * Reads the controlled C-01 / C-02 executable XLSX workbooks and emits
 * lib/canonical/generated/canonical-source.json with NO manual reinterpretation.
 *
 * The generated JSON is not a raw dump: it is mechanically mapped into the same
 * shape as lib/canonical/{source,modules,optionSets}.ts so that
 * scripts/verify-canonical.ts can assert the hand-maintained TypeScript
 * reproduces the controlled sheets exactly. Nothing in the mapping carries an
 * authored value - every field is read out of a cell.
 *
 * Usage:
 *   npx tsx scripts/ingest-canonical.ts <C-01.xlsx> <C-02.xlsx>
 *
 * Controlled sources:
 *   - C-01 Canonical Question Bank v1.0.1 CORRECTED   (questionnaire)
 *   - C-02 Canonical Scoring Rules & Golden Tests v1.0.1 CORRECTED (scoring)
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, basename } from "node:path";

type Cell = string | number | boolean | null | undefined;
type Sheet = Record<string, Cell>[];

function cellText(value: Cell): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

interface XlsxModule {
  readFile: (p: string) => { SheetNames: string[]; Sheets: Record<string, unknown> };
  utils: {
    // SheetJS's sheet_to_json is overloaded: with `header: 1` it returns an
    // array of arrays, otherwise an array of objects. The overloads are
    // declared explicitly here so the AoA call site is typed as Cell[][].
    sheet_to_json(sheet: unknown, opts: { header: 1 }): Cell[][];
    sheet_to_json(sheet: unknown, opts?: unknown): Array<Record<string, Cell>>;
  };
}

async function loadXlsx(): Promise<XlsxModule> {
  const moduleName = "xlsx";
  try {
    const loaded = (await import(moduleName)) as { default?: XlsxModule } & XlsxModule;
    return loaded.default ?? loaded;
  } catch {
    throw new Error(
      "The 'xlsx' package is required to ingest the controlled XLSX sources. " +
        "Install it with: npm install --save-dev xlsx",
    );
  }
}

/**
 * Locate a sheet's header row and return the rows beneath it as objects keyed
 * by the header cells. The controlled workbooks carry title/banner rows above
 * every table, so the header is found by scanning for the first row that
 * contains the expected `keyColumn`.
 */
function readTable(
  XLSX: XlsxModule,
  workbook: { Sheets: Record<string, unknown> },
  sheetName: string,
  keyColumn: string,
): Sheet {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Controlled sheet '${sheetName}' is missing.`);
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as Cell[][];

  const headerIndex = aoa.findIndex((row) =>
    row.some((cell) => cellText(cell) === keyColumn),
  );
  if (headerIndex < 0) {
    throw new Error(`Sheet '${sheetName}' has no header row containing '${keyColumn}'.`);
  }

  const headerRow = aoa[headerIndex];
  if (!headerRow) {
    throw new Error(`Sheet '${sheetName}' header row could not be read.`);
  }

  const header = headerRow.map((cell) => cellText(cell));
  return aoa
    .slice(headerIndex + 1)
    .filter((row) => row.some((cell) => cellText(cell) !== ""))
    .map((row) => {
      const record: Record<string, Cell> = {};
      header.forEach((name, index) => {
        if (name) record[name] = row[index] ?? null;
      });
      return record;
    });
}

/**
 * Read the "Field / Value" descriptor pairs from a README sheet, so the declared
 * source versions and counts come from the workbook, not from the code.
 */
function readDescriptor(
  XLSX: XlsxModule,
  workbook: { Sheets: Record<string, unknown> },
  sheetName: string,
): Record<string, string> {
  const rows = readTable(XLSX, workbook, sheetName, "Field");
  const descriptor: Record<string, string> = {};
  for (const row of rows) {
    const field = row["Field"];
    const value = row["Value"];
    if (field === null || field === undefined) continue;
    descriptor[cellText(field)] = value === null || value === undefined ? "" : String(value);
  }
  return descriptor;
}

/** Parse "Q1-Q8" into { first: 1, last: 8 }. */
function parseQuestionRange(range: Cell): { first: number; last: number } {
  const match = /Q(\d+)\s*-\s*Q(\d+)/.exec(String(range ?? ""));
  if (!match) throw new Error(`Unparseable question_range '${String(range)}'.`);
  return { first: Number(match[1]), last: Number(match[2]) };
}

/** Extract numeric bounds from a C-01 validation string such as "16-110 years". */
function parseBounds(validation: Cell): { min?: number; max?: number } {
  const match = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/.exec(String(validation ?? ""));
  if (!match) return {};
  return { min: Number(match[1]), max: Number(match[2]) };
}

function isBlank(value: Cell): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

async function main() {
  const [c01Path, c02Path] = process.argv.slice(2);
  if (!c01Path || !c02Path) {
    console.error("Usage: npx tsx scripts/ingest-canonical.ts <C-01.xlsx> <C-02.xlsx>");
    process.exitCode = 1;
    return;
  }

  const XLSX = await loadXlsx();
  const c01 = XLSX.readFile(c01Path);
  const c02 = XLSX.readFile(c02Path);

  // ---------------------------------------------------------------- C-01 ---
  const c01Readme = readDescriptor(XLSX, c01, "README");
  const c01Modules = readTable(XLSX, c01, "Modules", "module_id");
  const c01Questions = readTable(XLSX, c01, "Questions", "question_id");
  const c01OptionSets = readTable(XLSX, c01, "Option_Sets", "option_set_id");
  const c01Qa = readTable(XLSX, c01, "QA_Checks", "Check");

  // ---------------------------------------------------------------- C-02 ---
  const c02Readme = readDescriptor(XLSX, c02, "README");
  const c02Domains = readTable(XLSX, c02, "Domains", "domain_id");
  const c02Mapping = readTable(XLSX, c02, "Question_Mapping", "question_id");
  const c02OptionPoints = readTable(XLSX, c02, "Option_Points", "question_id");
  const c02Formulas = readTable(XLSX, c02, "Formulas", "rule_id");
  const c02Protective = readTable(XLSX, c02, "Protective_Factors", "factor_id");
  const c02Classifications = readTable(XLSX, c02, "Classifications", "scale");
  const c02Drivers = readTable(XLSX, c02, "Drivers_Evidence", "rule_id");
  const c02Golden = readTable(XLSX, c02, "Golden_Tests", "test_id");
  const c02Qa = readTable(XLSX, c02, "QA_Checks", "Check");

  // -- Option sets: C-01 defines id/label/is_na; C-02 supplies burden points.
  // C-02 Option_Points is per-question. A shared set (FREQ) keys identically
  // across every normal question, but reverse-scored items (Q26/Q28) invert the
  // same option, so the "points" carried by an option set must be taken from a
  // forward-scored question only. A reverse-scored question's points are the
  // forward points subtracted from the canonical maximum.
  const reverseScoredIds = new Set(
    c02Mapping.filter((row) => row["reverse_scored"] === true).map((row) => String(row["question_id"])),
  );
  const pointsBySetOption = new Map<string, number>();
  for (const row of c02OptionPoints) {
    const points = row["burden_points"];
    if (isBlank(points)) continue;
    const questionId = String(row["question_id"]);
    if (reverseScoredIds.has(questionId)) continue; // derived by inversion below
    const value = Number(points);
    const key = `${String(row["option_set_id"])}\u0000${String(row["option_id"])}`;
    const existing = pointsBySetOption.get(key);
    if (existing !== undefined && existing !== value) {
      throw new Error(
        `C-02 Option_Points disagrees for ${String(row["option_set_id"])}/` +
          `${String(row["option_id"])}: ${existing} vs ${value}.`,
      );
    }
    pointsBySetOption.set(key, value);
  }

  // Assert the reverse-scored rows are exactly the inversion of the forward
  // points for the same option, per C-02 SC-001 / the Question_Mapping note.
  for (const row of c02OptionPoints) {
    const questionId = String(row["question_id"]);
    if (!reverseScoredIds.has(questionId)) continue;
    if (isBlank(row["burden_points"])) continue;
    const forward = pointsBySetOption.get(
      `${String(row["option_set_id"])}\u0000${String(row["option_id"])}`,
    );
    if (forward === undefined) {
      throw new Error(`Reverse-scored ${questionId} has no forward points to invert.`);
    }
    const expectedInverted = 4 - forward;
    if (Number(row["burden_points"]) !== expectedInverted) {
      throw new Error(
        `Reverse-scored ${questionId}/${String(row["option_id"])} stores ` +
          `${String(row["burden_points"])} but the forward inversion is ${expectedInverted}.`,
      );
    }
  }

  const optionSets: Record<string, { id: string; options: unknown[] }> = {};
  const optionSetOrder: string[] = [];
  const optionSetScope = new Map<string, "scoring" | "contextual">();
  for (const row of c01OptionSets) {
    const setId = String(row["option_set_id"]);
    if (!optionSets[setId]) {
      optionSets[setId] = { id: setId, options: [] };
      optionSetOrder.push(setId);
    }
    const optionId = String(row["option_id"]);
    const isNa = row["is_na"] === true;
    const points = pointsBySetOption.get(`${setId}\u0000${optionId}`);
    const stored = row["stored_value_or_points"];
    const option: Record<string, unknown> = {
      id: optionId,
      label: String(row["display_label"]),
    };
    if (isNa) {
      option.isNa = true;
      option.exclusive = true;
    } else if (points !== undefined) {
      option.points = points;
      optionSetScope.set(setId, "scoring");
    } else if (!isBlank(stored)) {
      // Contextual set carrying a stored_value_or_points cell (YES_NO_UNSURE,
      // ANSWER_CONFIDENCE). C-02 does not list these questions in
      // Question_Mapping, so the cell is NOT a burden score: it is preserved as
      // `storedValue` and must never reach the burden engine.
      option.storedValue = Number(stored);
      if (!optionSetScope.has(setId)) optionSetScope.set(setId, "contextual");
    } else if (!optionSetScope.has(setId)) {
      optionSetScope.set(setId, "contextual");
    }
    // NOTE: `exclusive` for non-N/A options is NOT emitted. C-01's is_na column
    // is the only mutual-exclusivity signal in the controlled sheets; the
    // multi-select NONE options (CONDITIONS/NONE, MEDICATION_CONTEXT/NONE)
    // carry it at the questionnaire-rule level only, so the TypeScript
    // declaration of those flags documents C-01 VAL-004/VAL-005 rather than a
    // C-01 cell.
    optionSets[setId].options.push(option);
  }

  // -- Questions, mechanically mapped onto the lib/canonicalAssessment shape.
  const modulesById = new Map<string, Record<string, unknown>>();
  const moduleOrder: string[] = [];
  for (const row of c01Modules) {
    const id = String(row["module_id"]);
    const { first, last } = parseQuestionRange(row["question_range"]);
    modulesById.set(id, {
      id,
      order: Number(row["module_order"]),
      title: String(row["module_title"]),
      purpose: String(row["purpose"]),
      firstQuestionOrder: first,
      lastQuestionOrder: last,
      questionRange: String(row["question_range"]),
    });
    moduleOrder.push(id);
  }

  const mappingByQuestion = new Map<string, Record<string, Cell>>();
  for (const row of c02Mapping) mappingByQuestion.set(String(row["question_id"]), row);

  const questions = c01Questions.map((row) => {
    const id = String(row["question_id"]);
    const type = String(row["question_type"]);
    const optionSetId = isBlank(row["option_set_id"]) ? undefined : String(row["option_set_id"]);
    if (optionSetId && !optionSets[optionSetId]) {
      throw new Error(`Question ${id} references unknown option_set_id '${optionSetId}'.`);
    }
    const mapping = mappingByQuestion.get(id);
    const bounds = parseBounds(row["validation"]);
    const question: Record<string, unknown> = {
      id,
      order: Number(row["question_order"]),
      moduleId: String(row["module_id"]),
      moduleOrder: Number(row["module_order"]),
      text: String(row["question_text"]),
      type,
      required: row["required"] === true,
      allowNa: row["allow_na"] === true,
      conditionalLogic: String(row["conditional_logic"] ?? ""),
      validation: String(row["validation"] ?? ""),
      optionSetId,
      helpText: isBlank(row["help_text"]) ? undefined : String(row["help_text"]),
      scoringEligible: row["scoring_eligible"] === true,
      status: String(row["status"]),
    };
    if (bounds.min !== undefined) question.min = bounds.min;
    if (bounds.max !== undefined) question.max = bounds.max;
    if (mapping) {
      question.domain = String(mapping["domain_id"]);
      question.weight = Number(mapping["weight"]);
      question.reverseScored = mapping["reverse_scored"] === true;
      question.pointsMap = String(mapping["points_map"]);
    }
    return question;
  });

  // Cross-check the C-01 scoring flag against the C-02 mapping set exactly.
  const c01Scored = questions.filter((q) => q.scoringEligible === true).map((q) => String(q.id)).sort();
  const c02Scored = c02Mapping.map((r) => String(r["question_id"])).sort();
  const scoringFlagAgrees = JSON.stringify(c01Scored) === JSON.stringify(c02Scored);

  // -- Domain model from C-02 Domains + Formulas + Classifications.
  const domainTieOrder = c02Domains.map((row) => String(row["domain_id"]));
  const domainBands = c02Classifications
    .filter((row) => String(row["scale"]) === "DOMAIN")
    .map((row) => ({
      min: Number(row["minimum"]),
      max: Number(row["maximum"]),
      label: String(row["label"]),
    }));

  // -- Golden tests, mechanically decomposed into the engine's input shape.
  // C-02 encodes inputs as normalized burden points plus factor context; the
  // engine consumes option ids. Each burden point is resolved back to the
  // canonical option id that produces it. Two canonical option sets
  // (ACTIVITY_DAYS Q46, ACTIVITY_DURATION Q47) deliberately omit a burden-2
  // option, so C-02's normalized midpoint input is not directly reachable; the
  // nearest reachable burden is used and the approximation is recorded on the
  // generated test as `burdenApproximations` rather than silently absorbed.
  const questionsById = new Map<string, Record<string, unknown>>();
  for (const question of questions) questionsById.set(String(question.id), question);

  function reachableBurdens(questionId: string): number[] {
    const question = questionsById.get(questionId)!;
    const setId = question.optionSetId as string | undefined;
    if (!setId) return [0, 1, 2, 3, 4];
    const reverse = question.reverseScored === true;
    const values = new Set<number>();
    for (const option of optionSets[setId].options as Array<Record<string, unknown>>) {
      if (option.isNa || typeof option.points !== "number") continue;
      values.add(reverse ? 4 - option.points : option.points);
    }
    return [...values].sort((a, b) => a - b);
  }

  function optionIdAtBurden(questionId: string, burden: number): string {
    const question = questionsById.get(questionId);
    if (!question) throw new Error(`Golden test references unknown question ${questionId}.`);
    const setId = question.optionSetId as string | undefined;
    if (!setId) throw new Error(`Question ${questionId} has no option set for burden mapping.`);
    const reverse = question.reverseScored === true;
    for (const option of optionSets[setId].options as Array<Record<string, unknown>>) {
      if (option.isNa) continue;
      if (typeof option.points !== "number") continue;
      const effective = reverse ? 4 - option.points : option.points;
      if (effective === burden) return String(option.id);
    }
    throw new Error(`No option of ${setId} yields burden ${burden} for ${questionId}.`);
  }

  /** Nearest reachable burden, preferring the lower value on an exact tie. */
  function nearestReachableBurden(questionId: string, target: number): number {
    const values = reachableBurdens(questionId);
    if (values.includes(target)) return target;
    return values.reduce((best, value) =>
      Math.abs(value - target) < Math.abs(best - target) ? value : best,
    );
  }

  const goldenTests = c02Golden.map((row) => {
    const rawInput = JSON.parse(String(row["normalized_input_json"])) as Record<string, Cell>;
    const expected = JSON.parse(String(row["expected_output_json"])) as Record<string, unknown>;

    const answers: Record<string, unknown> = {};
    const burdenApproximations: Array<{ questionId: string; requested: number; used: number }> = [];
    for (const [key, value] of Object.entries(rawInput)) {
      if (!/^Q\d+$/.test(key)) continue;
      if (value === null || value === undefined) continue;
      const question = questionsById.get(key);
      if (!question) continue;
      if (!question.optionSetId) {
        answers[key] = Number(value);
        continue;
      }
      const requested = Number(value);
      const used = nearestReachableBurden(key, requested);
      if (used !== requested) burdenApproximations.push({ questionId: key, requested, used });
      answers[key] = optionIdAtBurden(key, used);
    }

    return {
      id: String(row["test_id"]),
      name: String(row["purpose"]),
      // Preserve the workbook's normalized input verbatim for the executable
      // Golden Test path. The answers field below is a readable option-ID
      // projection; it must not replace the normative normalized input.
      normalizedInput: rawInput,
      answers,
      // Context carried by C-02 that is not a scored answer (factors/age/etc.).
      context: Object.fromEntries(
        Object.entries(rawInput).filter(([key]) => !/^Q\d+$/.test(key)),
      ),
      // Recorded so an unreachable midpoint in the controlled sheet is visible
      // in the evidence rather than hidden inside the mapping.
      burdenApproximations,
      expected,
    };
  });

  // -- Version identity. The controlled workbook's internal version cells are
  // asserted against the delivery version in the filename (the CORRECTED
  // revision that ROOTS issued). A mismatch is reported, not silently absorbed:
  // C-01 v1.0.1 CORRECTED ships with an internal questionnaire_version cell of
  // 1.0.0, which is retained here as `declaredQuestionnaireVersion` so the
  // discrepancy stays visible in the evidence.
  const deliveryVersion = (path: string): string => {
    const match = /_v(\d+\.\d+\.\d+)_/.exec(basename(path));
    return match ? match[1] : "";
  };
  const c01Delivery = deliveryVersion(c01Path);
  const c02Delivery = deliveryVersion(c02Path);
  const c01Internal = String(c01Readme["questionnaire_version"] ?? "");
  const c02Internal = String(c02Readme["scoring_version"] ?? "");

  // ----------------------------------------------------------------- out ---
  const output = {
    generatedBy: "scripts/ingest-canonical.ts",
    generatedAt: new Date().toISOString(),
    sources: {
      questionnaire: {
        file: basename(c01Path),
        datasetId: c01Readme["Dataset ID"] ?? null,
        deliveryVersion: c01Delivery,
        declaredQuestionnaireVersion: c01Internal,
        internalVersionAgreesWithDelivery: c01Internal === c01Delivery,
        sheets: c01.SheetNames,
      },
      scoring: {
        file: basename(c02Path),
        datasetId: c02Readme["Dataset ID"] ?? null,
        deliveryVersion: c02Delivery,
        declaredScoringVersion: c02Internal,
        internalVersionAgreesWithDelivery: c02Internal === c02Delivery,
        sheets: c02.SheetNames,
      },
    },
    canonicalVersions: {
      questionnaire: `C-01 v${c01Delivery} CORRECTED`,
      scoring: `C-02 v${c02Delivery} CORRECTED`,
    },
    counts: {
      questions: questions.length,
      modules: moduleOrder.length,
      required: questions.filter((q) => q.required === true).length,
      optional: questions.filter((q) => q.required !== true).length,
      scoringEligible: questions.filter((q) => q.scoringEligible === true).length,
      optionSets: optionSetOrder.length,
      goldenTests: goldenTests.length,
    },
    modules: moduleOrder.map((id) => modulesById.get(id)),
    questions,
    optionSets: optionSetOrder.map((id) => ({
      ...optionSets[id],
      // Derived: does C-02 assign burden points to this set, or does it appear
      // only on non-scored C-01 questions? Drives the verifier's rule for
      // treating stored_value_or_points as points vs. a preserved context value.
      scoringScope: optionSetScope.get(id) ?? "contextual",
    })),
    scoring: {
      domainTieOrder,
      domainDefinitions: c02Domains.map((row) => ({
        id: String(row["domain_id"]),
        displayName: String(row["display_name"]),
        meaning: String(row["meaning"]),
        formula: String(row["formula"]),
      })),
      formulas: c02Formulas.map((row) => ({
        ruleId: String(row["rule_id"]),
        output: String(row["output"]),
        normativeFormula: String(row["normative_formula"]),
        nullOrBoundaryRule: String(row["null_or_boundary_rule"]),
        rounding: String(row["rounding"]),
      })),
      protectiveFactors: c02Protective.map((row) => ({
        factorId: String(row["factor_id"]),
        source: String(row["source"]),
        rule: String(row["activation/value rule"]),
        outputValue: row["output_value"],
        purpose: String(row["purpose"]),
        notes: String(row["notes"]),
      })),
      classificationBands: domainBands,
      classifications: c02Classifications.map((row) => ({
        scale: String(row["scale"]),
        min: Number(row["minimum"]),
        max: Number(row["maximum"]),
        label: String(row["label"]),
      })),
      driverRules: c02Drivers.map((row) => ({
        ruleId: String(row["rule_id"]),
        subject: String(row["subject"]),
        rule: String(row["deterministic rule"]),
        output: String(row["output"]),
        tieOrFallback: String(row["tie_or_fallback"]),
      })),
    },
    goldenTests,
    integrity: {
      scoringFlagAgreesAcrossSheets: scoringFlagAgrees,
      c01Qa: c01Qa.map((row) => ({
        check: String(row["Check"]),
        expected: row["Expected"],
        result: row["Result"],
      })),
      c02Qa: c02Qa.map((row) => ({
        check: String(row["Check"]),
        expected: row["Expected"],
        result: row["Result"],
      })),
    },
  };

  const outPath = "lib/canonical/generated/canonical-source.json";
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");

  console.log(`Ingested controlled sources mechanically -> ${outPath}`);
  console.log(`C-01 sheets: ${c01.SheetNames.join(", ")}`);
  console.log(`C-02 sheets: ${c02.SheetNames.join(", ")}`);
  console.log(
    `Questions ${questions.length} | Modules ${moduleOrder.length} | ` +
      `Required ${output.counts.required} | Optional ${output.counts.optional} | ` +
      `Scoring-eligible ${output.counts.scoringEligible} | ` +
      `Option sets ${optionSetOrder.length} | Golden tests ${goldenTests.length}`,
  );
  console.log(`C-01 scoring flag agrees with C-02 mapping: ${scoringFlagAgrees}`);
  if (!scoringFlagAgrees) process.exitCode = 1;
  if (output.sources.questionnaire.internalVersionAgreesWithDelivery === false) {
    console.log(
      `NOTE: C-01 ${basename(c01Path)} ships an internal questionnaire_version cell of ` +
        `'${c01Internal}' while the controlled delivery is v${c01Delivery} CORRECTED. ` +
        "The delivery version is recorded as canonical; the internal value is retained as evidence.",
    );
  }
  console.log(
    "Next: scripts/verify-canonical.ts asserts lib/canonical/*.ts reproduces this JSON.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

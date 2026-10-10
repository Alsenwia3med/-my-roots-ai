import canonicalSource from "./generated/canonical-source.json";
import { DOMAIN_OUTPUT_ORDER, type ScoringContext, type ScoringResult } from "@/lib/scoring";

export interface GoldenExpected {
  domains: Record<string, number | null>;
  coverage: Record<string, number>;
  biological_state: number | null;
  opportunity: number | null;
  recovery_potential: number | null;
  protective_count: number;
  confidence: number;
  drivers: string[];
}

export interface GoldenTest {
  id: string;
  name: string;
  rule: string;
  answers: Record<string, unknown>;
  normalizedInput: Record<string, unknown>;
  context: ScoringContext;
  burdenApproximations: Array<{ questionId: string; requested: number; used: number }>;
  expected: GoldenExpected;
}

const sourceTests = canonicalSource.goldenTests as unknown as GoldenTest[];
if (sourceTests.length !== 30) throw new Error(`C-02 source must contain exactly 30 Golden Tests; found ${sourceTests.length}`);

export const goldenTests: GoldenTest[] = sourceTests.map((test) => ({
  ...test,
  rule: `${test.name}. Expected JSON is loaded from the controlled C-02 v1.0.1 workbook export.`,
}));

export function toGoldenOutput(result: ScoringResult): GoldenExpected {
  const domains = Object.fromEntries(DOMAIN_OUTPUT_ORDER.map((id) => [id, result.domains[id]])) as Record<string, number | null>;
  const coverage = Object.fromEntries(DOMAIN_OUTPUT_ORDER.map((id) => [id, result.coverage[id]])) as Record<string, number>;
  return {
    domains,
    coverage,
    biological_state: result.biologicalState,
    opportunity: result.opportunity,
    recovery_potential: result.recoveryPotential,
    protective_count: result.protectiveCount,
    confidence: result.confidence,
    drivers: result.drivers,
  };
}

export function compare(actual: ScoringResult, expected: GoldenExpected): string[] {
  const output = toGoldenOutput(actual);
  return (Object.keys(expected) as Array<keyof GoldenExpected>)
    .filter((key) => JSON.stringify(output[key]) !== JSON.stringify(expected[key]))
    .map((key) => `${key}: expected ${JSON.stringify(expected[key])}, got ${JSON.stringify(output[key])}`);
}

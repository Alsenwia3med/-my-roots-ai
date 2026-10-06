import type { ScoringResult } from "@/lib/scoring";

export interface GeneratedReport extends ScoringResult {
  id: string;
  generatedAt: string;
}

export function buildReport(id: string, scores: ScoringResult): GeneratedReport {
  return { id, ...scores, generatedAt: new Date().toISOString() };
}

/**
 * ROOTS-AI(TM) data-access layer.
 *
 * Process-local Maps are used for in-memory storage. Session data is lost
 * on process restart or redeploy. Authorization remains the responsibility
 * of the route layer; this module never accepts a caller identity.
 */

import { CANONICAL_VERSIONS } from "@/lib/canonical/source";
import type { CanonicalReport } from "@/lib/canonical/report";

export const SESSION_TTL_SECONDS = 60 * 60;

export interface CanonicalReportRecord {
  id: string;
  assessmentId: string;
  report: CanonicalReport;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  createdAt: string;
  email?: string;
  answers: Record<string, unknown>;
  completedModules: string[];
  updatedAt?: string;
  /** Absolute server-side expiry. The cookie is not the only expiry control. */
  expiresAt?: string;
  canonicalVersions: { questionnaire: string; scoring: string };
}

export interface ReportRecord {
  id: string;
  sessionId: string;
  scores: Record<string, number>;
  band: string;
  createdAt: string;
  canonicalVersions: { questionnaire: string; scoring: string };
}

export interface ResultRecord {
  sessionId: string;
  result: unknown;
  questionnaireVersion: string;
  scoringVersion: string;
  createdAt: string;
}

const sessions = new Map<string, SessionRecord>();
const reports = new Map<string, ReportRecord>();
const results = new Map<string, ResultRecord>();
const canonicalReports = new Map<string, CanonicalReportRecord>();



function isSessionExpired(session: SessionRecord): boolean {
  const expiry = session.expiresAt ?? new Date(new Date(session.createdAt).getTime() + SESSION_TTL_SECONDS * 1000).toISOString();
  return Date.parse(expiry) <= Date.now();
}

async function loadSession(id: string): Promise<SessionRecord | null> {
  const cached = sessions.get(id);
  if (cached) {
    if (isSessionExpired(cached)) {
      sessions.delete(id);
      return null;
    }
    return cached;
  }
  return null;
}

async function loadResult(sessionId: string): Promise<ResultRecord | null> {
  const cached = results.get(sessionId);
  if (cached) return cached;
  return null;
}


/**
 * Create a new assessment session with canonical version tracking
 */
export async function createSession(id: string): Promise<SessionRecord> {
  const timestamp = new Date().toISOString();
  const session: SessionRecord = {
    id,
    createdAt: timestamp,
    answers: {},
    completedModules: [],
    updatedAt: timestamp,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
    canonicalVersions: { ...CANONICAL_VERSIONS },
  };
  sessions.set(id, session);
  return session;
}

export async function revokeSession(id: string): Promise<void> {
  sessions.delete(id);
  results.delete(id);
  canonicalReports.delete(id);
}

/**
 * Retrieve a session by ID. Returns null if not found or expired.
 */
export async function getSession(id: string): Promise<SessionRecord | null> {
  return loadSession(id);
}

/**
 * Update session email for contact/resume purposes
 */
export async function setSessionEmail(sessionId: string, email: string): Promise<void> {
  const session = await loadSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  const updated = { ...session, email, updatedAt: new Date().toISOString() };
  sessions.set(sessionId, updated);
}

/**
 * Save module answers and track module completion
 * Merges new answers with existing ones
 */
export async function saveModuleAnswers(
  sessionId: string,
  moduleId: string,
  answers: Record<string, unknown>,
  markComplete = true,
): Promise<SessionRecord> {
  const session = await loadSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const updatedAt = new Date().toISOString();
  const updated: SessionRecord = {
    ...session,
    answers: { ...session.answers, ...answers },
    completedModules: markComplete
      ? Array.from(new Set([...session.completedModules, moduleId]))
      : session.completedModules,
    updatedAt,
  };
  sessions.set(sessionId, updated);
  return updated;
}

/**
 * Create a report record linking to session and canonical versions
 */
export async function createReport(
  id: string,
  sessionId: string,
  scores: Record<string, number>,
  band: string
): Promise<ReportRecord> {
  const session = await loadSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const report: ReportRecord = {
    id,
    sessionId,
    scores,
    band,
    createdAt: new Date().toISOString(),
    canonicalVersions: { ...session.canonicalVersions },
  };
  reports.set(id, report);
  return report;
}

/**
 * Retrieve a report by ID. Returns null if not found.
 */
export async function getReport(id: string): Promise<ReportRecord | null> {
  return reports.get(id) ?? null;
}

/**
 * Assessment progress interface
 * Computed deterministically from stored answers
 */
export interface AssessmentProgress {
  answeredCount: number;
  totalQuestions: number;
  answeredRequired: number;
  totalRequired: number;
  completedModules: string[];
  completedModuleCount: number;
  totalModules: number;
  currentModuleId: string;
  percentComplete: number;
  isComplete: boolean;
}

/**
 * Compute assessment progress from stored answers
 * Progress is deterministic - refresh cannot corrupt state
 */
export async function getProgress(
  id: string,
  totalQuestions: number,
  totalRequired: number,
  moduleOrder: string[],
  requiredQuestionIds: string[],
  isValidAnswer: (questionId: string, value: unknown) => boolean,
): Promise<AssessmentProgress | null> {
  const session = await loadSession(id);
  if (!session) return null;

  const answeredIds = Object.keys(session.answers);
  const answeredRequired = requiredQuestionIds.filter((qid) => isValidAnswer(qid, session.answers[qid])).length;
  const firstIncomplete = moduleOrder.find((m) => !session.completedModules.includes(m));

  return {
    answeredCount: answeredIds.filter((qid) => isValidAnswer(qid, session.answers[qid])).length,
    totalQuestions,
    answeredRequired,
    totalRequired,
    completedModules: session.completedModules,
    completedModuleCount: session.completedModules.filter((m) => moduleOrder.includes(m)).length,
    totalModules: moduleOrder.length,
    currentModuleId: firstIncomplete ?? moduleOrder[moduleOrder.length - 1],
    percentComplete: Math.round((answeredRequired / totalRequired) * 100),
    isComplete: answeredRequired === totalRequired,
  };
}

/**
 * Save scoring result with canonical version tracking
 */
export async function saveResult(
  sessionId: string,
  result: unknown,
  versions: { questionnaire: string; scoring: string },
): Promise<ResultRecord> {
  const record: ResultRecord = {
    sessionId,
    result,
    questionnaireVersion: versions.questionnaire,
    scoringVersion: versions.scoring,
    createdAt: new Date().toISOString(),
  };
  results.set(sessionId, record);
  return record;
}

/**
 * Retrieve scoring result by session ID. Returns null if not found.
 */
export async function getResult(sessionId: string): Promise<ResultRecord | null> {
  return loadResult(sessionId);
}

/**
 * Canonical immutable report storage (M3).
 *
 * Stores the full CanonicalReport object produced by lib/report/pipeline.ts.
 * This is the authoritative source for BOTH the web report and the PDF: neither
 * renderer recalculates anything.
 *
 * Process-local Maps are used for in-memory storage. Session data is lost
 * on process restart or redeploy.
 */
export async function saveCanonicalReport(
  report: CanonicalReportRecord,
): Promise<CanonicalReportRecord> {
  const existing = canonicalReports.get(report.id);
  if (existing) return existing;
  canonicalReports.set(report.id, report);
  return report;
}

/** Retrieve a stored canonical report by its report id. */
export async function getCanonicalReport(
  id: string,
): Promise<CanonicalReportRecord | null> {
  return canonicalReports.get(id) ?? null;
}

/**
 * Retrieve a stored canonical report by the assessment it was produced from.
 * Used by the report route, which is addressed by session id.
 */
export async function getCanonicalReportByAssessment(
  assessmentId: string,
): Promise<CanonicalReportRecord | null> {
  for (const report of canonicalReports.values()) {
    if (report.assessmentId === assessmentId) return report;
  }
  return null;
}

/**
 * Utility: Get active session count (for monitoring)
 */
export function getActiveSessionCount(): number {
  return sessions.size;
}

/**
 * Utility: Clear all sessions (for testing only)
 */
export function clearAllSessions(): void {
  sessions.clear();
  reports.clear();
  results.clear();
  canonicalReports.clear();
}

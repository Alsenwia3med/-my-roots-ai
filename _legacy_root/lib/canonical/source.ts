/**
 * ROOTS-AI(TM) Phase 1 MVP - Controlled canonical source descriptor.
 *
 * Controlled sources:
 *   - C-01 Canonical Question Bank v1.0.1 CORRECTED   (questionnaire)
 *   - C-02 Canonical Scoring Rules & Golden Tests v1.0.1 CORRECTED (scoring)
 *
 * This module is the SINGLE place where the canonical version identifiers and
 * the canonical domain model are declared. Every other module derives from it.
 *
 * IMPORTANT (M2 control rule): the values in `domainModel` below must reproduce
 * the controlled C-02 v1.0.1 source exactly. They are declared here as data so
 * that the deterministic engine contains no hidden domain assumptions and so
 * that a corrected source version can be adopted by editing this one block.
 *
 * NOTE: The C-01 / C-02 XLSX files are the canonical executable sources. When
 * they are ingested (scripts/ingest-canonical.ts) the generated JSON they
 * produce is checked against this descriptor and the declared versions must
 * match. No generated value may be hand-edited away from its source.
 */

export const CANONICAL_VERSIONS = {
  questionnaire: "C-01 v1.0.1 CORRECTED",
  scoring: "C-02 v1.0.1 CORRECTED",
} as const;

export type CanonicalVersions = typeof CANONICAL_VERSIONS;

/**
 * Canonical seven-domain model (C-02 v1.0.1).
 *
 * Tie order is fixed and immutable: MR -> HS -> SR -> CH -> SL -> IB -> BS.
 *
 * BIO_STATE is the Biological State roll-up identifier. It is NOT a scored
 * domain in the tie order; it is the id used for the derived Biological State
 * value and its classification. BS remains exclusively Biological Safety
 * Signals(TM) and is an ordinary scored domain.
 */
export const DOMAIN_TIE_ORDER = [
  "MR",
  "HS",
  "SR",
  "CH",
  "SL",
  "IB",
  "BS",
] as const;
export type DomainId = (typeof DOMAIN_TIE_ORDER)[number];

/** Derived Biological State identifier (never a tie-order domain). */
export const BIO_STATE = "BIO_STATE" as const;

export const DOMAIN_LABELS: Record<DomainId, string> = {
  MR: "Metabolic Resistance\u2122",
  HS: "Hunger & Satiety Signals\u2122",
  SR: "Sleep Recovery Index\u2122",
  CH: "Circadian Health Score\u2122",
  SL: "Stress Load\u2122",
  IB: "Inflammation Burden Index\u2122",
  BS: "Biological Safety Signals\u2122",
};

export const BIO_STATE_LABEL = "Biological State";

export interface DomainModel {
  /** Scored domains in fixed tie order. */
  domains: readonly DomainId[];
  /** Derived Biological State identifier. */
  biologicalStateId: typeof BIO_STATE;
  /** Canonical raw burden scale minimum. */
  rawBurdenMin: 0;
  /** Canonical raw burden scale maximum. */
  rawBurdenMax: 4;
  /** Domain coverage threshold (0-1). Below this the domain returns null. */
  coverageThreshold: 0.5;
  /** Minimum available domains required for a Biological State value. */
  biologicalStateMinDomains: 7;
  /** Number of available domains required (5 of 7). */
  biologicalStateRequiredDomains: 5;
  /** Maximum point gap for co-primary driver behaviour. */
  coPrimaryGap: 3;
  /** Decimal places retained for Opportunity / Recovery Potential. */
  secondaryScoreDecimals: 1;
  /**
   * Minimum domain score for driver eligibility (C-02 DRV-001: "Available
   * domain score >= 25"). A null domain, or a domain below this floor, is never
   * a driver and never a co-primary partner.
   */
  driverEligibilityFloor: 25;
  /** Maximum number of driver entries emitted (C-02 DRV-002 primary/secondary/tertiary). */
  driverMaxEntries: 3;
}

export const DOMAIN_MODEL: DomainModel = {
  domains: DOMAIN_TIE_ORDER,
  biologicalStateId: BIO_STATE,
  rawBurdenMin: 0,
  rawBurdenMax: 4,
  coverageThreshold: 0.5,
  biologicalStateMinDomains: 7,
  biologicalStateRequiredDomains: 5,
  coPrimaryGap: 3,
  secondaryScoreDecimals: 1,
  driverEligibilityFloor: 25,
  driverMaxEntries: 3,
};

/** Versioned identity string persisted with every stored answer set / result. */
export function canonicalVersionIdentity(): string {
  return `${CANONICAL_VERSIONS.questionnaire} | ${CANONICAL_VERSIONS.scoring}`;
}

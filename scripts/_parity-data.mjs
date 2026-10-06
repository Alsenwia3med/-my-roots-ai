/**
 * Live-site parity audit.
 *
 * Loads each public ROOTS-AI route from the local build and asserts the
 * controlled copy (C-04) that must match roots-ai.health exactly.
 * Phrases that are present on the live site but missing locally fail the audit.
 */

const TM = "\u2122";
const MD = "\u2014";
const ND = "\u2013";

/** Shell copy that must appear on every public page. */
const SHELL = [
  "How It Works", "Platform", "Example Report", "Research", "About", "More",
  "Start Your Assessment", "Healthcare Professionals", "Pilot Program",
  "Contact", "Blog", "Privacy", "Terms", "Cookies",
  "Medical Disclaimer", "AI Disclaimer",
  `ROOTS-AI${TM} provides educational wellness information and does not diagnose or treat medical conditions.`,
  `\u00a9 2026 ROOTS AI HEALTH SYSTEMS, Inc. All rights reserved.`,
  `We use essential technologies to keep ROOTS-AI${TM} secure.`,
];

/** Stale copy from the previous revision that must no longer appear. */
const FORBIDDEN = {
  "/how-it-works": ["THE ROOTS-AI METHOD"],
  "/platform": ["Architecture principle"],
  "/healthcare-professionals": ["ROOTS / PROFESSIONALS"],
  "/pilot": ["ROOTS / PILOT"],
  "/research": ["ROOTS / INSIGHTS"],
};

export { SHELL, FORBIDDEN, TM, MD, ND };

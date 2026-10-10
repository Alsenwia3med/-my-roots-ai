/**
 * Participant-facing copy for the assessment (ASM-01 to ASM-10) and its system messages.
 *
 * Every string records its authority:
 *   C-04  Website Content & Legal Copy Pack v1.0.0 (exact approved copy)
 *   C-05  UI/UX Screen Implementation Specification v1.0.0 (labels named in the screen spec)
 *   PENDING  functional wording that no controlled document supplies. Kept minimal and neutral,
 *            listed in docs/m3/ROOTS-AI_M3_Vendor_Copy_Register.md for ROOTS approval, and
 *            replaced verbatim once approved. No claim, promise or health statement is made in
 *            PENDING copy. Regenerate the register with `npm run check:vendor-copy`.
 */

export const LEGAL_VERSION = { version: '1.0', effectiveDate: '21 July 2026', effectiveDateIso: '2026-07-21' };

/** C-04 §3 "/assessment — Assessment". */
export const ASSESSMENT_ENTRY = {
  headline: 'Your ROOTS Biological Assessment',
  intro:
    'Answer 73 questions across 13 short modules. Most people finish in about 10–12 minutes. You can save, pause and resume securely.',
  cta: 'Begin Assessment',
  bullets: [
    'Use your usual experience during the last four weeks unless a question says otherwise.',
    'There are no “good” answers. Choose what best reflects your experience.',
    'N/A is available only where approved and is never treated as zero.',
    'Your answers generate educational wellness indicators, not a diagnosis.',
    'If you may be in immediate danger, contact local emergency services; this form is not monitored for emergencies.',
  ],
} as const;

/** C-04 §9 Consent and System Messages. */
export const SYSTEM = {
  consentService:
    'I agree to the Terms of Service and acknowledge the Privacy Notice and Medical and AI Disclaimers. I understand that ROOTS-AI™ is educational and not a diagnosis or medical service.',
  consentResearch:
    'Optional: I consent to the use of approved, minimized and pseudonymized assessment data for the research purpose described in the Pilot Information Sheet. I understand that I may decline without losing service access and may withdraw according to the Privacy Notice.',
  save: 'Saved',
  saveFail:
    'We could not save this answer. Check your connection and try again. Your current entry remains on this device until you leave or refresh.',
  sessionExpired: 'For your security, this session has expired. Request a new secure link to continue.',
} as const;

/** C-05 screen labels (the spec names these actions and zones explicitly). */
export const LABELS = {
  agreeAndContinue: 'Agree and Continue', // ASM-04 zone 5
  startModule1: 'Start Module 1', // ASM-05 zone 5
  saveAndExit: 'Save & Exit', // ASM-06 zone 1, ASM-07 zone 3
  continueAssessment: 'Continue Assessment', // ASM-07 zone 3
  resumeAssessment: 'Resume Assessment', // ASM-08 zone 4
  submitAssessment: 'Submit Assessment', // ASM-09 zone 5
  backToAnswers: 'Back to Answers', // ASM-09 zone 5
  back: 'Back', // ASM-06 zone 5
  next: 'Next', // ASM-06 zone 5
  complete: 'Complete', // ASM-09 zone 1
  needsAttention: 'Needs attention', // ASM-09 zone 1
  saving: 'Saving', // ASM-06 zone 6
  failed: 'Failed', // ASM-06 zone 6
} as const;

/** PENDING ROOTS approval — see docs/m3/ROOTS-AI_M3_Vendor_Copy_Register.md. */
export const PENDING = {
  emailLabel: 'Email address',
  emailPrivacyNote: 'We use your email only to send your secure link. See the Privacy Notice.',
  ageAcknowledgement: 'I confirm that I am 18 or older.',
  sendingLink: 'Sending…',
  requestFailed: 'We could not send your secure link. Please try again.',
  checkEmailHeadline: 'Check your email',
  checkEmailBody:
    'If the address can be used, we have sent a secure link to it. The link works once and expires after a short time. Check your inbox and spam folder.',
  resend: 'Send a new link',
  resendWait: 'You can request a new link in {seconds} s.',
  changeEmail: 'Use a different email',
  linkErrorHeadline: 'This link can’t be used',
  linkErrorBody: 'Secure links work once and expire after a short time. Request a new link to continue.',
  requestNewLink: 'Request a new secure link',
  contactSupport: 'Contact support',
  consentHeadline: 'Before you begin',
  signedInAs: 'Signed in as {email}',
  decline: 'Decline and exit',
  consentRequired: 'Please agree to continue.',
  consentSaveFailed: 'We could not save your choice. Please try again.',
  consentVersion: 'Version {version} • Effective {date}',
  startHeadline: 'About your assessment',
  startFailed: 'We could not start your assessment. Please try again.',
  required: 'Required',
  optional: 'Optional',
  retrySave: 'Try again',
  modulesHeading: '13 modules',
  savePrivacy: 'Your answers save automatically as you go. To return later, request a new secure link with the same email.',
  moduleOf: 'Module {n} of 13',
  percentComplete: '{percent}% complete',
  notApplicable: 'Not applicable',
  selectUnit: 'Unit',
  characterCount: '{count} / 1,000 characters',
  saveExitTitle: 'Save and exit',
  lastSaved: 'Last saved {time}',
  notSavedYet: 'No answers saved yet.',
  saveExitBody: 'Your saved answers stay with your assessment. To continue later, request a new secure link using the same email.',
  resumeHeadline: 'Welcome back',
  resumeProgress: '{complete} of 13 modules complete. You will continue at Module {n}: {title}.',
  questionnaireVersion: 'Questionnaire version {version}',
  restart: 'Start again',
  restartConfirmTitle: 'Start the assessment again?',
  restartConfirmBody: 'Your saved answers for this assessment will be archived and a new, empty assessment will start. This cannot be undone.',
  restartConfirm: 'Yes, start again',
  cancel: 'Cancel',
  reviewHeadline: 'Review your answers',
  reviewOptional: 'Optional questions may be left blank.',
  reviewUnanswered: 'Unanswered: {questions}',
  reportNameLabel: 'Name for your report (optional)',
  reportNameHint: 'Shown on the cover of your report. Leave blank to show “Participant”.',
  reportNameInvalid: 'Use letters, spaces, hyphens and apostrophes only, up to 60 characters.',
  reportNameSaveFailed: 'We could not save your name. Try again, or clear the field to continue.',
  // ASM-06 zone 4: Next is governed — required questions on this module must be answered first.
  answerRequired: 'Answer this question to continue.',
  completeModuleToContinue: 'Answer the highlighted questions to continue.',
  movingOn: 'Saving…',
  reviewBoundary:
    'When you submit, your answers are saved as a final record and can no longer be changed. Your answers generate educational wellness indicators, not a diagnosis.',
  submitting: 'Submitting…',
  submitFailed: 'We could not submit your assessment. Your answers are saved. Please try again.',
  submittedHeadline: 'Assessment submitted',
  submissionReference: 'Submission reference {reference}',
  submittedAt: 'Submitted {time}',
  stepAnswersReceived: 'Answers received',
  stepScores: 'Scores calculated',
  stepReport: 'Report prepared',
  stepPending: 'Not yet available',
  signOut: 'Sign out',
  offline: 'You are offline. Your current entry remains on this device until you leave or refresh.',
  sessionWarning: 'Your session will end in {minutes} min because of inactivity.',
  extendSession: 'Stay signed in',
  magicLinkSubject: 'Your ROOTS-AI™ secure link',
  magicLinkEmailBody:
    'Use this secure link to continue to your ROOTS Biological Assessment. It works once and expires in {minutes} minutes.\n\n{link}\n\nIf you did not request this link, you can ignore this email.',
} as const;

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

/**
 * C-04 Website Content & Legal Copy Pack v1.0.1 CORRECTED (ROOTS-C04-WEB-001), sections 4-8 and
 * 11, transcribed as data.
 *
 * Every participant-facing sentence on /privacy, /terms, /cookies, /medical-disclaimer and
 * /ai-disclaimer comes from here; the pages only lay it out. C-04 §1 forbids replacing governed
 * legal content with shortened marketing summaries, so the wording below is verbatim: no
 * paraphrase, no abridgement, no re-ordering of the approved sections.
 *
 * Where C-04 marks a clause as awaiting jurisdiction-specific legal approval (Terms, "Governing
 * framework"), that text is reproduced as written rather than resolved — configuring a
 * governing law is ROOTS-AI's decision per launch market, not an implementation detail.
 */

export interface LegalBlock {
  heading: string;
  paragraphs: string[];
}

export interface LegalTable {
  caption: string;
  columns: string[];
  rows: string[][];
  /** Shown under the table where a required column has nothing to report. */
  note?: string;
}

/** A link to another governed notice (C-05 LEG-02 z4, LEG-04 z5, LEG-05 z5 "Related"). */
export interface LegalLink {
  label: string;
  href: string;
}

export interface LegalDocument {
  route: string;
  /** Page heading. */
  title: string;
  /** Breadcrumb label above the heading. */
  kicker: string;
  blocks: LegalBlock[];
  table?: LegalTable;
  /** C-05 zone 1 "Title/meta": the approved effective-date line, and its note where C-04 gives one. */
  effective?: { line: string; note?: string };
  /**
   * C-05 LEG-04 z2 "Callout" and LEG-05 z2 "Summary" — the boundary stated before the full text.
   * Both are sentences lifted verbatim from the same C-04 notice, never new wording.
   */
  callout?: string;
  /** C-05 LEG-04 z4 "Emergency": the fixed local-emergency direction, as its own zone. */
  emergency?: string;
  /** C-05 LEG-02 z4 / LEG-04 z5 / LEG-05 z5. */
  related?: LegalLink[];
  /** C-05 LEG-01 z4 "Rights CTA": the contact / data-rights request channel. */
  rightsCta?: { text: string; label: string; href: string };
  /** C-05 LEG-03 z3 "Preferences": opens the consent panel. */
  preferences?: boolean;
  /**
   * Vendor-authored disclosures that C-04 does not supply, printed beneath the controlled text
   * and never mixed into it.
   *
   * ROOTS directed two of these on 1 October 2026 (M3 closure requirements, section 5). C-04
   * carries no wording for either, and C-04 section 1 forbids replacing governed copy with
   * vendor text - so they are held apart, excluded from the C-04 verbatim gate by construction,
   * and each is registered in the vendor copy register with the evidence that supports it. The
   * register's gate fails if a claim here loses its support.
   */
  vendorNotes?: { heading: string; paragraphs: string[] };
  references?: { label: string; href?: string }[];
}

export const LEGAL_KICKER = 'ROOTS / LEGAL';

/**
 * C-05 requires a Title/meta zone with effective date and version on every LEG screen; C-04
 * prints that line only beneath the Privacy Notice and the Terms.
 *
 * ROOTS decision, 25 September 2026: the shared line may be used across the five notices only
 * where C-04 expressly establishes that metadata for the complete legal pack, and the
 * controlling provision must be identified.
 *
 * Controlling provision — C-04 document header, page 1:
 *     "ROOTS-AI™ C-04 Website Content & Legal Copy Pack — Version 1.0.1 CORRECTED"
 *     "Document ID: ROOTS-C04-WEB-001"
 *     "Status: APPROVED EXECUTABLE CONTENT RELEASE — CONTROLLED CORRECTION"
 *     "Effective date: 21 July 2026"
 *
 * The header states one version and one effective date for the pack as a whole, and the five
 * notices are sections of that pack. No separate date or version is assigned to any notice.
 */
export const LEGAL_EFFECTIVE_DATE = '21 July 2026';
export const LEGAL_VERSION = '1.0.1';
export const EFFECTIVE_LINE = `Effective date: ${LEGAL_EFFECTIVE_DATE} • Version: ${LEGAL_VERSION}.`;

/** Link labels are the approved footer-legal names (C-04 §2). */
const LINK = {
  privacy: { label: 'Privacy', href: '/privacy' },
  terms: { label: 'Terms', href: '/terms' },
  cookies: { label: 'Cookies', href: '/cookies' },
  medical: { label: 'Medical Disclaimer', href: '/medical-disclaimer' },
  ai: { label: 'AI Disclaimer', href: '/ai-disclaimer' },
} as const;

// ----------------------------------------------------------------- 4. Privacy Notice

export const PRIVACY: LegalDocument = {
  route: '/privacy',
  title: 'Privacy Notice',
  kicker: LEGAL_KICKER,
  blocks: [
    {
      heading: 'Who we are',
      paragraphs: [
        'ROOTS AI HEALTH SYSTEMS, Inc. (“ROOTS-AI™”, “we”, “us”) provides an educational biological assessment and reporting service. This notice explains how we handle personal data when you use the Phase 1 web platform.',
      ],
    },
    {
      heading: 'Data we collect',
      paragraphs: [
        'Account and contact information; assessment answers; physical measurements you provide; consent records; generated scores and reports; device, security and audit information; support enquiries; and limited public-site analytics where consent is required. We do not intentionally collect emergency information through the assessment.',
      ],
    },
    {
      heading: 'Why we use it',
      paragraphs: [
        'To provide, secure and improve the service; save and resume assessments; generate and deliver reports; respond to enquiries; meet legal and security obligations; and conduct separately consented research or pilot analysis.',
      ],
    },
    {
      heading: 'Sensitive data',
      paragraphs: [
        'Assessment answers and identifiable wellness information may be sensitive personal data. We process them only for stated purposes and with appropriate consent or other lawful authority required by applicable law.',
      ],
    },
    {
      heading: 'Research',
      paragraphs: [
        'Research participation is optional and requires separate explicit consent. Service access is not conditioned on research consent. Approved research exports are minimized and pseudonymized or de-identified; direct identifiers, authentication data and report narratives are excluded.',
      ],
    },
    {
      heading: 'Providers and transfers',
      paragraphs: [
        'We may use approved hosting, authentication, email, AI-language and security providers under written safeguards. Identifiable assessment data is not sent to an AI provider unless the approved configuration, agreements and minimization controls permit it. Cross-border transfers are assessed and governed under applicable transfer requirements, including documented review of the destination, recipient safeguards and other legally required transfer conditions before deployment.',
      ],
    },
    {
      heading: 'AI use',
      paragraphs: [
        'Deterministic rules calculate scores and classifications. AI may assist with approved explanatory wording using minimized structured inputs. AI does not diagnose, prescribe or change scores.',
      ],
    },
    {
      heading: 'Retention',
      paragraphs: [
        'Assessment, report, consent, audit and security records are retained according to the approved retention schedule and legal needs. Data is deleted or de-identified when no longer required, subject to security backups and legal obligations.',
      ],
    },
    {
      heading: 'Security',
      paragraphs: [
        'We use access controls, MFA for privileged roles, encryption in transit and at rest where supported, private report storage, audit logging, backups and security testing. ROOTS-AI™ maintains a documented personal-data-breach response process and, where applicable, will notify the Personal Data Protection Commissioner and affected data subjects in the manner and time required by law. Where applicable, a Data Protection Officer is appointed and notified to the Commissioner in accordance with current requirements. No system can guarantee absolute security.',
      ],
    },
    {
      heading: 'Your choices and rights',
      paragraphs: [
        'Depending on applicable law, you may request access, correction, deletion, restriction, withdrawal of consent, information about processing or a copy of relevant data. Withdrawal does not affect earlier lawful processing and may limit service functions that require the data.',
      ],
    },
    {
      heading: 'Cookies and analytics',
      paragraphs: [
        'Essential technologies support authentication and security. Optional public-site analytics are used only where permitted and consented. Assessment, report, authentication and admin routes do not use advertising pixels, session replay or behavioural advertising.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        'Production launch is intended for adults aged 18 or older. Participation below 18 is not enabled unless ROOTS-AI™ approves and implements a jurisdiction-specific consent and guardian workflow.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        'Submit privacy questions or rights requests through the secure Contact page and choose “Privacy”. We may verify identity before fulfilling a request.',
      ],
    },
    {
      heading: 'Updates',
      paragraphs: [
        'We may update this notice when the service or law changes. The page displays the effective date and version; material changes are communicated where required.',
      ],
    },
  ],
  // C-05 LEG-01 z4 — the data-rights request channel, in the words of the C-04 "Contact" section.
  rightsCta: {
    text: 'Submit privacy questions or rights requests through the secure Contact page and choose “Privacy”. We may verify identity before fulfilling a request.',
    label: 'Contact',
    href: '/contact',
  },
  effective: {
    line: EFFECTIVE_LINE,
    note: 'This notice is designed with reference to Malaysia’s Personal Data Protection Act 2010, the Personal Data Protection (Amendment) Act 2024, applicable commencement instruments, and current official guidance and circulars, including data-breach notification, Data Protection Officer and cross-border transfer requirements. It does not represent certification of compliance.',
  },
  // C-04 §11 Official Legal Reference Links.
  references: [
    { label: 'Malaysia Personal Data Protection Act 2010', href: 'https://www.pdp.gov.my/ppdpv1/en/akta/pdp-act-2010-en/' },
    { label: 'Personal Data Protection (Amendment) Act 2024', href: 'https://www.pdp.gov.my/ppdpv1/en/akta/personal-data-protection-amendment-act-2024/' },
    { label: 'Data Breach Notification Guideline', href: 'https://www.pdp.gov.my/ppdpv1/wp-content/uploads/2025/08/GP_DBN_ENG.pdf' },
    { label: 'Cross-Border Personal Data Transfer Guideline', href: 'https://www.pdp.gov.my/ppdpv1/wp-content/uploads/2025/08/GP_CBPDT_EN-1.pdf' },
    { label: 'Data Protection Officer Guideline/Circular: official Personal Data Protection Commissioner guidance and circulars current at deployment.' },
  ],
};

// ----------------------------------------------------------------- 5. Terms of Service

export const TERMS: LegalDocument = {
  route: '/terms',
  title: 'Terms of Service',
  kicker: LEGAL_KICKER,
  blocks: [
    {
      heading: 'Agreement and eligibility',
      paragraphs: [
        'By accessing ROOTS-AI™, you agree to these Terms and the Privacy Notice. You must be at least 18 years old for the production launch unless a separately approved minor workflow applies. Do not use the service if you cannot lawfully agree.',
      ],
    },
    {
      heading: 'Educational service',
      paragraphs: [
        'ROOTS-AI™ provides educational wellness information from self-reported answers. It is not a medical device, healthcare provider, diagnostic service, clinical assessment, prognosis or emergency service.',
      ],
    },
    {
      heading: 'No medical reliance',
      paragraphs: [
        'Do not use ROOTS-AI™ to diagnose, treat or prevent disease, make medication decisions, delay professional care or respond to an emergency. Seek qualified professional advice for medical concerns.',
      ],
    },
    {
      heading: 'Your information',
      paragraphs: [
        'Provide information you are authorized to submit and that reasonably reflects your experience. You are responsible for reviewing your submitted answers and protecting access to your email and Magic Link.',
      ],
    },
    {
      heading: 'Reports and scores',
      paragraphs: [
        'Scores are proprietary questionnaire indicators. They are not clinically validated probabilities of disease, future outcomes or treatment response. Reports may contain AI-assisted wording governed by deterministic outputs and fixed safety rules.',
      ],
    },
    {
      heading: 'Acceptable use',
      paragraphs: [
        'Do not bypass security, access another person’s data, scrape the service, introduce malware, reverse engineer confidential scoring logic, misuse reports for employment or insurance decisions, or represent output as a diagnosis.',
      ],
    },
    {
      heading: 'Intellectual property',
      paragraphs: [
        'ROOTS-AI™ software, content, scoring methods, prompts, designs and trademarks belong to ROOTS AI HEALTH SYSTEMS, Inc. or its licensors. Personal use of your own report is permitted; no other licence is granted.',
      ],
    },
    {
      heading: 'Availability and beta',
      paragraphs: [
        'The service may change, pause or contain beta limitations. We may correct errors, suspend unsafe activity and preserve historical report versions. Future capabilities marked Coming Soon are not part of the current service.',
      ],
    },
    {
      heading: 'Disclaimers',
      paragraphs: [
        'To the extent permitted by law, the service is provided without a guarantee of uninterrupted availability, fitness for a clinical purpose or a particular health or weight outcome. Nothing excludes rights that cannot lawfully be excluded.',
      ],
    },
    {
      heading: 'Limitation',
      paragraphs: [
        'To the extent permitted by law, ROOTS-AI™ is not liable for decisions made by treating educational output as medical advice, indirect loss or loss caused by unauthorized account access outside our reasonable control. Applicable consumer rights remain unaffected.',
      ],
    },
    {
      heading: 'Suspension and termination',
      paragraphs: [
        'You may stop using the service. We may suspend access for security, unlawful use or material breach. Data handling after termination follows the Privacy Notice and retention schedule.',
      ],
    },
    {
      heading: 'Governing framework',
      paragraphs: [
        'The governing-law and forum text for production is a jurisdiction-controlled deployment variable and must be legally approved for each launch market before that market is enabled. Until that approved jurisdiction-specific text is configured, this clause must not be presented as a final governing-law selection. Mandatory consumer and data-protection rights continue to apply.',
      ],
    },
    {
      heading: 'Contact and changes',
      paragraphs: [
        'Questions may be submitted through the Contact page. The current version and effective date appear on this page. Continued use after a notified change constitutes acceptance where permitted by law.',
      ],
    },
  ],
  // C-05 LEG-02 z4 "Related: Privacy, Medical, AI disclaimer links".
  related: [LINK.privacy, LINK.medical, LINK.ai],
  effective: {
    line: EFFECTIVE_LINE,
    note: 'Final production deployment requires jurisdiction-specific legal review and approval, including the governing-law/forum block, before each launch market is enabled.',
  },
};

// ----------------------------------------------------------------- 6. Cookie Notice

export const COOKIE_CATEGORIES = [
  {
    category: 'Strictly necessary',
    treatment: 'Authentication, secure sessions, CSRF protection, load balancing and preference storage',
    control: 'Always active where necessary for service delivery and security.',
  },
  {
    category: 'Public-site analytics',
    treatment: 'Aggregate page and conversion measurement on public pages only',
    control: 'Disabled until required consent; withdraw through cookie controls.',
  },
  {
    category: 'Advertising',
    treatment: 'No behavioural advertising or retargeting in Phase 1',
    control: 'Not used.',
  },
  {
    category: 'Session replay',
    treatment: 'Prohibited on assessment, report, authentication and admin routes',
    control: 'Not used on protected routes.',
  },
  {
    category: 'Health data',
    treatment: 'Never placed in analytics, advertising or replay payloads',
    control: 'Mandatory technical control.',
  },
] as const;

/** C-04 §6 — the approved banner wording and button labels. */
export const COOKIE_BANNER = {
  body: 'We use essential technologies to keep ROOTS-AI™ secure. With your permission, we may use limited analytics on public pages. We do not use advertising pixels or session replay on assessment, report, sign-in or admin pages.',
  accept: 'Accept optional analytics',
  reject: 'Reject optional analytics',
  manage: 'Manage choices',
} as const;

/**
 * Two disclosures ROOTS directed on 1 October 2026 that C-04 does not supply.
 *
 * `cfClearance` is conditional and factual. The deployed Phase 1 configuration runs the
 * Cloudflare challenge platform - observed on the live origin, which answers a request without a
 * clearance cookie with `Cf-Mitigated: challenge` and loads
 * `/cdn-cgi/challenge-platform/.../main.js`. ROOTS directed that where it is actually used it be
 * disclosed accurately as a strictly necessary security technology, never as analytics or
 * advertising, and never claimed where it is not set.
 *
 * `sessionDuration` publishes no number. ROOTS directed that a fixed duration not be invented:
 * the authenticated-session lifetime is governed by the configured authentication settings, and
 * a published figure would have to correspond to an approved, verified configuration value
 * first. The application sets no session lifetime of its own.
 */
export const COOKIE_VENDOR_NOTES = {
  heading: 'Additional Phase 1 disclosures',
  cfClearance:
    'Where the Cloudflare challenge platform is active on this service, it may set a clearance cookie (cf_clearance) after a security challenge is completed. It is a strictly necessary security technology used to distinguish legitimate visitors from automated traffic. It is not analytics, not advertising, and is not used to profile you.',
  sessionDuration:
    'The length of an authenticated session is governed by the configured authentication and session settings rather than by a fixed period published here.',
} as const;

export const COOKIES: LegalDocument = {
  route: '/cookies',
  title: 'Cookie Notice',
  kicker: LEGAL_KICKER,
  blocks: [{ heading: 'Cookie banner', paragraphs: [COOKIE_BANNER.body] }],
  /*
   * C-05 LEG-03 z4 asks for "Category, purpose, provider, duration where used"; C-04 §6 supplies
   * Category, Phase 1 treatment (the purpose) and Consent/control, and no provider or duration.
   *
   * ROOTS decision, 25 September 2026: retain the C-04 columns and do not invent provider or
   * duration values. An earlier note here concluded that no provider or duration exists — that
   * conclusion does not follow merely from C-04 not listing them, so it has been removed. The
   * actual Phase 1 cookie and browser-storage inventory is recorded in
   * docs/m3/ROOTS-AI_M3_Decision_Log.md for ROOTS to confirm against the controlled legal copy
   * before anything further is published here.
   */
  table: {
    caption: 'How each category is treated in Phase 1',
    columns: ['Category', 'Phase 1 treatment', 'Consent/control'],
    rows: COOKIE_CATEGORIES.map((c) => [c.category, c.treatment, c.control]),
  },
  // C-05 LEG-03 z3 "Preferences: open consent panel".
  preferences: true,
  vendorNotes: {
    heading: COOKIE_VENDOR_NOTES.heading,
    paragraphs: [COOKIE_VENDOR_NOTES.cfClearance, COOKIE_VENDOR_NOTES.sessionDuration],
  },
  effective: { line: EFFECTIVE_LINE },
  related: [LINK.privacy, LINK.terms],
};

// ----------------------------------------------------------------- 7. Medical Disclaimer

export const MEDICAL_DISCLAIMER: LegalDocument = {
  route: '/medical-disclaimer',
  title: 'Medical Disclaimer',
  kicker: LEGAL_KICKER,
  blocks: [
    {
      heading: 'Medical Disclaimer',
      paragraphs: [
        'ROOTS-AI™ provides educational wellness information based primarily on self-reported answers. It is not a medical device, doctor, healthcare provider, diagnostic test, clinical risk assessment, prognosis or treatment service. It does not establish a clinician-patient relationship and does not replace medical history, examination, laboratory testing or professional judgment. Do not start, stop or change medication, supplements, diet, exercise or treatment because of a ROOTS-AI™ report without appropriate professional advice. Questionnaire scores are proprietary indicators and are not validated probabilities of disease or future outcomes. Persistent, severe, sudden or worsening symptoms require appropriate professional evaluation. If you believe you may be in immediate danger, contact local emergency services.',
      ],
    },
  ],
  // z2 "Callout: Not diagnosis or medical service" — the governed boundary, verbatim. Both
  // sentences are taken, because the second begins "It is not…" and needs its subject to be
  // readable on its own.
  callout:
    'ROOTS-AI™ provides educational wellness information based primarily on self-reported answers. It is not a medical device, doctor, healthcare provider, diagnostic test, clinical risk assessment, prognosis or treatment service.',
  // z4 "Emergency: Fixed local-emergency direction".
  emergency: 'If you believe you may be in immediate danger, contact local emergency services.',
  related: [LINK.terms, LINK.ai],
  effective: { line: EFFECTIVE_LINE },
};

// ----------------------------------------------------------------- 8. AI Disclaimer

export const AI_DISCLAIMER: LegalDocument = {
  route: '/ai-disclaimer',
  title: 'AI Disclaimer',
  kicker: LEGAL_KICKER,
  blocks: [
    {
      heading: 'AI Disclaimer',
      paragraphs: [
        'ROOTS-AI™ uses the approved C-02 v1.0.1 deterministic rules to calculate questionnaire scores, classifications, driver outputs, data-quality indicators and eligible content. C-03 v1.0.1 governs report structure, null states and approved explanation objects. An AI language model may assist only in expressing approved information clearly. The model is not permitted to calculate or change scores, classifications, drivers or null states; diagnose disease; prescribe treatment; interpret laboratory results; or invent participant facts. AI-assisted text can be incomplete or imperfect; fixed validation, logging and fallback rules are applied. Review the underlying answers and limitations, and consult a qualified professional for medical decisions.',
      ],
    },
  ],
  // z2 "Summary: AI does not calculate or change scores" — the governed sentence that says so.
  callout:
    'The model is not permitted to calculate or change scores, classifications, drivers or null states; diagnose disease; prescribe treatment; interpret laboratory results; or invent participant facts.',
  related: [LINK.medical, LINK.privacy],
  // z4 "Versioning: current disclaimer/version identifier".
  effective: { line: EFFECTIVE_LINE },
};

export const LEGAL_DOCUMENTS = [PRIVACY, TERMS, COOKIES, MEDICAL_DISCLAIMER, AI_DISCLAIMER] as const;

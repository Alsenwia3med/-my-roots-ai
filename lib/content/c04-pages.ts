/**
 * C-04 Website Content & Legal Copy Pack v1.0.1 CORRECTED (ROOTS-C04-WEB-001), section 3
 * "Production Page Copy" and section 10 "SEO and Metadata", transcribed as data.
 *
 * Every participant-facing sentence on the public pages comes from here; the pages lay it out
 * and add nothing. C-04 §1 forbids unsupported diagnosis, disease-prevention, treatment,
 * clinical-validation, medical-device or guaranteed-outcome claims, and requires future
 * capabilities to be labelled "Coming Soon" rather than presented as available — both of which
 * are properties of this copy, so keeping it verbatim is what keeps them true.
 *
 * Verified against the controlled PDF by `npm run check:c04`.
 */

export interface PageCta {
  label: string;
  href: string;
}

/**
 * A C-05 screen zone. The heading is the zone name C-05 gives it — functional labelling, marked
 * PENDING like the rest of the wording C-04 does not supply — and every item under it is
 * verbatim C-04 copy.
 */
export type ZoneKind =
  /** A numbered sequence, paced as an editorial flow rather than a list. */
  | 'sequence'
  /** One statement given weight — a boundary, a principle, a fact. */
  | 'statement'
  /** Capability items carrying an availability status (File 14: no false availability). */
  | 'status'
  /** Supporting points, separated by rule rather than enclosed in a box. */
  | 'points';

export interface PageZone {
  heading: string;
  items: string[];
  /**
   * How the zone is presented. File 14 §6 requires "subtle layering, elevation and visual
   * grouping" and warns against "excessive outlined boxes"; §6.1 rejects "repeated generic
   * cards". So the treatment follows what the content is, rather than one card repeated.
   */
  kind?: ZoneKind;
  /** Columns of the 12-column grid this zone occupies on desktop. */
  span?: 4 | 6 | 8 | 12;
  /** A short label above the heading, where the zone benefits from one. */
  eyebrow?: string;
  /** Semantic emphasis: 'affirm' for what the system does, 'limit' for what it never does. */
  tone?: 'affirm' | 'limit';
}

export interface PageContent {
  route: string;
  /** C-04 "Headline". */
  headline: string;
  /** C-04 "Intro". */
  intro: string;
  /** C-04 "CTA", split where the pack lists two separated by "•". */
  ctas: PageCta[];
  /** The bullet list C-04 prints beneath the page's copy block. */
  bullets: string[];
  /** C-04 §10 SEO and Metadata, where the pack supplies a row for the route. */
  meta?: { title: string; description: string };
  /** C-05 screen zones, where the screen specifies more structure than a single bullet list. */
  zones?: PageZone[];
}

/** C-04 §1 — the two approved calls to action, used wherever the pack names them. */
export const PRIMARY_CTA: PageCta = { label: 'Start Your Assessment', href: '/assessment' };
export const SECONDARY_CTA: PageCta = { label: 'View Example Report', href: '/example-report' };

/** C-04 §1 — brand and product statement. */
export const PRODUCT_STATEMENT = 'Medicine Before Symptoms™';

// ----------------------------------------------------------------- / Home

export const HOME: PageContent = {
  route: '/',
  headline: 'Decode the Biology Before You Fight the Weight',
  intro:
    'ROOTS-AI™ turns a structured assessment into a governed biological intelligence report—helping you understand patterns in metabolism, hunger, sleep, circadian timing, stress, inflammation-related signals and perceived biological resistance.',
  ctas: [PRIMARY_CTA, SECONDARY_CTA],
  bullets: [
    'Beyond a number on the scale — see the pattern behind the struggle.',
    'Seven biological domains — one connected view.',
    'Deterministic scores — AI assists with explanation, not calculation.',
    'Your report — 19 transparent sections with your answers and limitations.',
    'Private by design — controlled access, versioning and audit.',
    'Educational, not diagnostic — designed to support informed conversations and realistic next steps.',
  ],
  meta: {
    title: 'ROOTS-AI™ — Decode the Biology Before You Fight the Weight',
    description: 'A governed biological assessment and educational report across seven connected domains.',
  },
};

// ----------------------------------------------------------------- /assessment

export const ASSESSMENT_ENTRY: PageContent = {
  route: '/assessment',
  headline: 'Your ROOTS Biological Assessment',
  intro:
    'Answer 73 questions across 13 short modules. Most people finish in about 10–12 minutes. You can save, pause and resume securely.',
  ctas: [{ label: 'Begin Assessment', href: '/assessment/start' }],
  bullets: [
    'Use your usual experience during the last four weeks unless a question says otherwise.',
    'There are no “good” answers. Choose what best reflects your experience.',
    'N/A is available only where approved and is never treated as zero. Required multi-select questions must contain one or more approved option IDs; an empty array is invalid. None/N/A options are exclusive where provided and must not be combined with other options.',
    'Your answers generate educational wellness indicators, not a diagnosis.',
    'If you may be in immediate danger, contact local emergency services; this form is not monitored for emergencies.',
  ],
  meta: {
    title: 'ROOTS Biological Assessment™',
    description: 'Complete 73 questions across 13 modules and receive a transparent educational report.',
  },
};

// ----------------------------------------------------------------- /example-report

export const EXAMPLE_REPORT: PageContent = {
  route: '/example-report',
  headline: 'See What Your Biological Report Looks Like',
  intro:
    'Explore the full 19-section structure using fictional sample data. The example does not represent a real person or a clinical result.',
  ctas: [{ label: 'View Example', href: '#example' }, PRIMARY_CTA],
  bullets: [
    'Seven-domain breakdown.',
    'Deterministic driver outputs and available protective factors. The interface must support zero to three driver outputs, including a co-primary pair as one output entry, without inventing missing drivers or protective factors.',
    '90-day educational roadmap.',
    'Transparent answers, limitations and disclaimer.',
  ],
  meta: {
    title: 'ROOTS-AI™ Example Biological Report',
    description: 'Explore the 19-section structure using fictional sample data.',
  },
};

// ----------------------------------------------------------------- /how-it-works

export const HOW_IT_WORKS: PageContent = {
  route: '/how-it-works',
  headline: 'From Answers to Biological Intelligence',
  intro: 'ROOTS-AI™ follows a controlled sequence so that interpretation never replaces the underlying data.',
  // C-04 names "Start Your Assessment"; C-05 PUB-02 z6 asks for Example Report alongside it.
  ctas: [PRIMARY_CTA, SECONDARY_CTA],
  bullets: [
    '1. Complete the 73-question assessment.',
    '2. Validation normalizes approved responses and preserves N/A.',
    '3. Deterministic rules calculate seven domains and derived indicators.',
    '4. C-02 v1.0.1 deterministic rules select driver outputs, confidence and eligible content; no website or AI layer may independently recalculate or replace them.',
    '5. Governed AI may express only C-02/C-03-approved explanation objects in clear language; it cannot change scores, classifications, drivers, null states or report structure.',
    '6. The web and PDF reports render from the same immutable report record.',
  ],
  meta: {
    title: 'How ROOTS-AI™ Works',
    description: 'See how deterministic scoring and governed AI-assisted explanations create your report.',
  },
  /*
   * C-05 PUB-02 zones: 1 Intro · 2 Four-step process · 3 What AI does · 4 What AI does not do ·
   * 5 Privacy block · 6 CTA. The process zone carries C-04's own six numbered steps, which are
   * the controlled description of that sequence. Zones 3 and 4 use the two sentences from the
   * C-04 AI Disclaimer that state each side of the boundary, and zone 5 the Home privacy line —
   * all verbatim, so no new claim about AI or privacy is introduced here.
   */
  zones: [
    {
      heading: 'The controlled sequence',
      kind: 'sequence',
      span: 12,
      eyebrow: 'Six steps',
      items: [
        '1. Complete the 73-question assessment.',
        '2. Validation normalizes approved responses and preserves N/A.',
        '3. Deterministic rules calculate seven domains and derived indicators.',
        '4. C-02 v1.0.1 deterministic rules select driver outputs, confidence and eligible content; no website or AI layer may independently recalculate or replace them.',
        '5. Governed AI may express only C-02/C-03-approved explanation objects in clear language; it cannot change scores, classifications, drivers, null states or report structure.',
        '6. The web and PDF reports render from the same immutable report record.',
      ],
    },
    {
      heading: 'What AI does',
      kind: 'statement',
      span: 6,
      tone: 'affirm',
      items: ['An AI language model may assist only in expressing approved information clearly.'],
    },
    {
      heading: 'What AI does not do',
      kind: 'statement',
      span: 6,
      tone: 'limit',
      items: [
        'The model is not permitted to calculate or change scores, classifications, drivers or null states; diagnose disease; prescribe treatment; interpret laboratory results; or invent participant facts.',
      ],
    },
    {
      heading: 'Privacy',
      kind: 'statement',
      span: 12,
      items: ['Private by design — controlled access, versioning and audit.'],
    },
  ],
};

// ----------------------------------------------------------------- /platform

export const PLATFORM: PageContent = {
  route: '/platform',
  headline: 'One Foundation. Deeper Layers Over Time.',
  intro:
    'Phase 1 delivers the assessment and governed report engine. Future layers will expand biological context only after separate validation, governance and implementation.',
  ctas: [{ label: 'Explore the Assessment', href: '/assessment' }],
  // C-04 §1: future capabilities are labelled "Coming Soon" and are not represented as available.
  bullets: [
    'Available: Assessment and governed report engine.',
    'Coming Soon: Laboratory data integration.',
    'Coming Soon: DNA and epigenetic insights.',
    'Coming Soon: Microbiome analysis.',
    'Coming Soon: Wearable integrations.',
    'Coming Soon: ROOTS Biological Twin™.',
  ],
  meta: {
    title: 'ROOTS-AI™ Platform',
    description: 'Assessment and governed reporting now; deeper biological layers coming later.',
  },
  /*
   * C-05 PUB-03 zones: 1 Hero · 2 Available now · 3 Coming soon · 4 Architecture principle ·
   * 5 CTA. Separating available from forthcoming is the point of the screen — "Show Phase 1 and
   * future modules without false availability" — so the two lists never share a zone.
   */
  zones: [
    {
      heading: 'Available now',
      kind: 'status',
      span: 12,
      items: ['Available: Assessment and governed report engine.'],
    },
    {
      heading: 'Coming soon',
      kind: 'status',
      span: 12,
      items: [
        'Coming Soon: Laboratory data integration.',
        'Coming Soon: DNA and epigenetic insights.',
        'Coming Soon: Microbiome analysis.',
        'Coming Soon: Wearable integrations.',
        'Coming Soon: ROOTS Biological Twin™.',
      ],
    },
    { heading: 'One connected system', kind: 'statement', span: 12, items: ['Seven biological domains — one connected view.'] },
  ],
};

// ----------------------------------------------------------------- /research

export const RESEARCH: PageContent = {
  route: '/research',
  headline: 'Building Biological Intelligence Responsibly',
  intro:
    'ROOTS-AI™ is designed to support ethical pilot studies and de-identified research under separate consent, data minimization and documented governance.',
  ctas: [{ label: 'Research Enquiries', href: '/contact' }],
  bullets: [
    'Service consent and research consent are separate.',
    'Research export excludes direct identifiers and report narratives.',
    'Pseudonymized data is not described as anonymous unless the methodology supports that claim.',
    'Pilot findings will be reported with limitations; questionnaire scores are not clinical endpoints unless separately validated.',
  ],
  meta: {
    title: 'ROOTS-AI™ Research',
    description: 'Learn about ethical pilots, separate research consent and minimized data use.',
  },
  // C-05 PUB-05 zones: 1 Hero · 2 Principles · 3 Pilot information · 4 Collaboration · 5 Boundary.
  zones: [
    {
      heading: 'Principles',
      kind: 'points',
      span: 6,
      items: [
        'Service consent and research consent are separate.',
        'Pseudonymized data is not described as anonymous unless the methodology supports that claim.',
      ],
    },
    {
      heading: 'Pilot information',
      kind: 'points',
      span: 6,
      items: [
        'Pilot findings will be reported with limitations; questionnaire scores are not clinical endpoints unless separately validated.',
      ],
    },
    {
      heading: 'Boundary',
      kind: 'statement',
      span: 12,
      tone: 'limit',
      items: ['Research export excludes direct identifiers and report narratives.'],
    },
  ],
};

// ----------------------------------------------------------------- /healthcare-professionals

export const HEALTHCARE_PROFESSIONALS: PageContent = {
  route: '/healthcare-professionals',
  headline: 'A Transparent Educational Report for Better Conversations',
  intro:
    'ROOTS-AI™ helps participants organize self-reported patterns before discussing persistent concerns with a qualified professional. It does not replace clinical history, examination, diagnosis or care.',
  ctas: [SECONDARY_CTA],
  bullets: [
    'See the exact answers behind each score.',
    'Review data completeness and confidence.',
    'Distinguish deterministic calculation from AI-assisted wording.',
    'Use suggested laboratory discussions only as optional conversation prompts.',
  ],
  /*
   * C-05 PUB-06 zones: 1 Hero · 2 Use cases · 3 Evidence boundary · 4 Report overview · 5 CTA.
   * The evidence boundary uses the C-04 Medical Disclaimer sentence that states it exactly,
   * rather than a restatement.
   */
  zones: [
    {
      heading: 'Use cases',
      kind: 'points',
      span: 6,
      items: ['See the exact answers behind each score.', 'Review data completeness and confidence.'],
    },
    {
      heading: 'Evidence boundary',
      kind: 'statement',
      span: 6,
      tone: 'limit',
      items: [
        'Questionnaire scores are proprietary indicators and are not validated probabilities of disease or future outcomes.',
      ],
    },
    {
      heading: 'What the report shows',
      kind: 'points',
      span: 12,
      items: [
        'Distinguish deterministic calculation from AI-assisted wording.',
        'Use suggested laboratory discussions only as optional conversation prompts.',
      ],
    },
  ],
};

// ----------------------------------------------------------------- /pilot

export const PILOT: PageContent = {
  route: '/pilot',
  headline: 'Join the ROOTS-AI™ Free Beta',
  intro:
    'The beta explores whether a structured, non-diagnostic assessment can help people understand self-reported patterns involving weight resistance, energy, sleep, stress and appetite.',
  ctas: [{ label: 'Check Eligibility', href: '/assessment' }],
  bullets: [
    'Eligibility: adults aged 18 or older unless a separately approved local workflow applies.',
    'Participation is voluntary and may be withdrawn according to the Privacy Notice.',
    'The report is educational and is not medical care.',
    'Beta feedback may be used to improve usability; research use requires separate explicit consent.',
    'No payment is required for the approved beta cohort.',
  ],
  /*
   * C-05 PUB-07 zones: 1 Hero · 2 Eligibility · 3 Benefits · 4 Timeline · 5 Privacy/consent ·
   * 6 FAQs · 7 CTA. Zones 4 and 6 are not implemented: C-04 supplies no timeline and no approved
   * FAQ content, and inventing either would make claims about the beta that ROOTS has not made.
   * Raised for approved copy.
   */
  zones: [
    {
      heading: 'Eligibility',
      kind: 'statement',
      span: 6,
      items: ['Eligibility: adults aged 18 or older unless a separately approved local workflow applies.'],
    },
    {
      heading: 'What participation includes',
      kind: 'points',
      span: 6,
      items: [
        'Answer 73 questions across 13 short modules. Most people finish in about 10–12 minutes. You can save, pause and resume securely.',
        'No payment is required for the approved beta cohort.',
        'The report is educational and is not medical care.',
      ],
    },
    {
      heading: 'Privacy and consent',
      kind: 'points',
      span: 12,
      items: [
        'Participation is voluntary and may be withdrawn according to the Privacy Notice.',
        'Beta feedback may be used to improve usability; research use requires separate explicit consent.',
      ],
    },
  ],
};

// ----------------------------------------------------------------- /about

export const ABOUT: PageContent = {
  route: '/about',
  headline: PRODUCT_STATEMENT,
  intro:
    'ROOTS-AI™ was created around a simple idea: biology often adapts long before a diagnosis is made. Our role is not to label disease, but to help people see patterns earlier, ask better questions and choose realistic next steps.',
  ctas: [{ label: 'How It Works', href: '/how-it-works' }],
  bullets: [
    'Mission: make complex biological patterns understandable without turning an educational tool into a diagnosis.',
    'Method: structured data, deterministic rules, governed language and visible limitations.',
    'Company: ROOTS AI HEALTH SYSTEMS, Inc., Delaware, USA.',
  ],
  meta: {
    title: 'About ROOTS-AI™',
    description: 'Medicine Before Symptoms™ — structured biological intelligence with visible limitations.',
  },
  // C-05 PUB-08 zones: 1 Hero · 2 Problem · 3 Framework · 4 Company · 5 Safety · 6 CTA.
  zones: [
    {
      heading: 'Mission and method',
      kind: 'points',
      span: 12,
      items: [
        'Mission: make complex biological patterns understandable without turning an educational tool into a diagnosis.',
        'Method: structured data, deterministic rules, governed language and visible limitations.',
      ],
    },
    { heading: 'Framework', kind: 'statement', span: 6, items: ['Seven biological domains — one connected view.'] },
    { heading: 'Company', kind: 'statement', span: 6, items: ['Company: ROOTS AI HEALTH SYSTEMS, Inc., Delaware, USA.'] },
    {
      heading: 'Safety',
      kind: 'statement',
      span: 12,
      tone: 'limit',
      items: ['Educational, not diagnostic — designed to support informed conversations and realistic next steps.'],
    },
  ],
};

// ----------------------------------------------------------------- /contact

export const CONTACT: PageContent = {
  route: '/contact',
  headline: 'Start the Right Conversation',
  intro:
    'Use the secure form for product support, privacy requests, research collaboration or business enquiries. Do not send urgent medical information.',
  ctas: [{ label: 'Send Enquiry', href: '#contact-form' }],
  bullets: [
    'Fields: enquiry type, name, email, message, consent checkbox.',
    'Message limit: 2,000 characters.',
  ],
};

/** C-04 /contact — the approved confirmation and emergency wording. */
export const CONTACT_CONFIRMATION =
  'Thank you. Your enquiry has been received. We will respond through the contact details you provided.';

export const CONTACT_EMERGENCY_NOTICE =
  'This form is not monitored for emergencies. Contact local emergency services if you may be in immediate danger.';

/*
 * The enquiry type C-04 lists among the /contact fields was removed at ROOTS' instruction, and
 * the constant that carried its values is removed with it rather than left as dead export.
 *
 * The categories C-04 names are still in the approved intro above — "product support, privacy
 * requests, research collaboration or business enquiries" — which is verbatim-checked and
 * unchanged. That sentence remains the record of what C-04 says; a partial list here would have
 * been a worse one.
 */

export const CONTACT_MESSAGE_LIMIT = 2000;

// ----------------------------------------------------------------- /blog

export const BLOG: PageContent = {
  route: '/blog',
  headline: 'Medicine Before Symptoms™ — Insights',
  intro:
    'Educational articles about metabolism, hunger, sleep, circadian biology, stress, behaviour and responsible health technology.',
  ctas: [{ label: 'Explore Insights', href: '#articles' }],
  bullets: [
    'Every article displays author, review date, sources and educational disclaimer.',
    'No article is personalized medical advice.',
  ],
};

/** C-04 /blog — the approved launch state, used until content is separately approved. */
export const BLOG_EMPTY_STATE = 'Our first evidence-informed insights are being prepared. Please return soon.';

export const PUBLIC_PAGES = [
  HOME,
  ASSESSMENT_ENTRY,
  EXAMPLE_REPORT,
  HOW_IT_WORKS,
  PLATFORM,
  RESEARCH,
  HEALTHCARE_PROFESSIONALS,
  PILOT,
  ABOUT,
  CONTACT,
  BLOG,
] as const;

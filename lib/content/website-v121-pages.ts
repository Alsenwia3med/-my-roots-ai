/**
 * ROOTS-AI™ Website — Complete Revised Publication Candidate v1.21: the pages that set the
 * document's running copy around their own functional content (Example Report, Insights,
 * Contact, Assessment entry). Companion to ./website-v121.ts; same rules — verbatim, no
 * paraphrase, no abridgement, no re-ordering.
 *
 * The document's two editorial notes are not published here either (see ./website-v121.ts).
 */

import type { PageZone } from './c04-pages';

interface Cta {
  label: string;
  href: string;
}

// ----------------------------------------------------------------- /example-report

/**
 * The running copy around the interactive example. The 19-section viewer itself is the report
 * data in ./example-report.ts and is not part of this document.
 */
export const EXAMPLE_REPORT_PAGE = {
  kicker: 'ROOTS-AI™ | EXAMPLE REPORT',
  headline: 'Your Health Is More Than a Collection of Answers.',
  tagline: 'See how individual responses become a clearer, connected picture.',
  intro:
    'Sleep, stress, appetite, metabolic patterns, and daily functioning do not exist in isolation. Yet understanding how they appear together is rarely straightforward.',
  introMore: [
    'The ROOTS Biological Intelligence Report™ brings self-reported patterns into one structured, educational view — helping you explore what stands out, what may be connected, where strengths exist, and what remains uncertain.',
    'The findings come from defined rules. AI helps make them understandable.',
  ],
  badge: { label: 'Example Report — Fictional Participant', text: 'Illustrative preview. Not a real participant or clinical result.' },
  before: [
    {
      heading: 'A Look Inside Your Report',
      kind: 'prose',
      items: [],
      paragraphs: ['Explore a fictional example of the 19-section report, organized around seven interconnected health domains.'],
    },
    {
      heading: 'Your Biological State™',
      kind: 'prose',
      sub: 'Strained (questionnaire-derived illustrative classification; not a measured biological state)',
      items: [],
      paragraphs: [
        'The sample illustrates how a questionnaire-derived classification can summarize reported patterns. It does not measure biological function directly or establish a diagnosis.',
      ],
    },
    {
      heading: 'Your Seven-Domain Overview',
      kind: 'prose',
      items: [],
      paragraphs: [
        'See how the report presents patterns across appetite, metabolic regulation, sleep, circadian timing, stress, inflammation-related symptoms, and biological safety signals. Each domain is interpreted within the limits of the submitted answers.',
      ],
    },
    {
      heading: 'Your Key Patterns',
      kind: 'prose',
      items: [],
      paragraphs: [
        'The report highlights questionnaire-derived factors identified through predefined rules, helping distinguish areas requiring attention from reported strengths and protective factors. These relationships are not presented as proven causes.',
      ],
    },
    {
      heading: 'Your Educational Priorities',
      kind: 'prose',
      items: [],
      paragraphs: [
        'Explore how approved guidance can be organized into manageable steps involving daily routines, nutrition, activity, and recovery. Recommendations are educational, not individualized medical treatment.',
      ],
    },
    {
      heading: 'Explore All 19 Sections',
      kind: 'prose',
      lead: 'The complete report is organized into the following sections:',
      items: [
        'Cover Page',
        'Executive Summary',
        'ROOTS Biological State™',
        'ROOTS Opportunity Score™ (proprietary questionnaire-derived educational indicator)',
        'ROOTS Confidence™ (assessment-internal data sufficiency and consistency; not diagnostic certainty)',
        'Key Drivers (rule-identified patterns; not established causes)',
        'Seven-Domain Score Breakdown',
        'Biological Triad™ (educational grouping; not a clinically validated biological measurement)',
        'Future Projection (educational scenario only; not a validated forecast of disease or clinical outcomes)',
        '90-Day Roadmap',
        'Nutrition Priorities',
        'Action Priorities',
        'What Is Going Well',
        'Specific Concerns',
        'Suggested Laboratory Discussion',
        'Participant Answers',
        'Biological Card',
        'Final Word',
        'Medical and AI Disclaimer',
      ],
    },
    {
      heading: 'Explore the Interactive Example',
      kind: 'prose',
      items: [],
      paragraphs: [
        "The demonstration is intended to show the report's organization, visual presentation, and educational purpose.",
      ],
    },
  ] satisfies PageZone[],
  after: [
    {
      heading: 'Designed to Explain. Not to Diagnose.',
      kind: 'prose',
      tone: 'limit',
      sub: 'A meaningful report should be clear about both its findings and its limits.',
      items: [],
      paragraphs: [
        'ROOTS-AI™ uses predefined analytical rules to establish eligible scores, classifications, and report content. Governed AI may help express approved explanations but cannot independently change the underlying findings.',
        'The report does not directly measure cellular activity, hormones, inflammation, or other underlying biological mechanisms. It does not diagnose disease, predict clinical outcomes, or replace professional medical evaluation.',
      ],
    },
    {
      heading: 'One Report. A More Connected Perspective.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'Your answers are not the whole story of your health. But organized carefully, they can provide a useful starting point for understanding reported patterns and deciding which questions deserve further attention.',
      ],
    },
  ] satisfies PageZone[],
  ctas: [
    { label: 'Start Your Assessment', href: '/assessment' },
    { label: 'Explore How It Works', href: '/how-it-works' },
  ] satisfies Cta[],
  footnote:
    'Example only — fictional educational content. ROOTS-AI™ provides non-diagnostic wellness information based on self-reported answers. It is not a substitute for qualified medical advice, appropriate testing, or individualized care.',
};

// ----------------------------------------------------------------- /blog  (Insights)

export const INSIGHTS_PAGE = {
  kicker: 'ROOTS-AI™ / INSIGHTS',
  headline: 'The Questions Behind Better Understanding.',
  tagline: 'Medicine Before Symptoms™',
  intro: 'Biology rarely fits into a single headline. Neither should the way we explain it.',
  before: [
    {
      kind: 'prose',
      heading: '',
      items: [
        'Why can two people respond differently to the same meal?',
        "Why can a poor night's sleep change how hungry we feel?",
        'Why do normal test results and persistent symptoms sometimes coexist?',
      ],
    },
    {
      kind: 'prose',
      heading: '',
      items: [],
      paragraphs: [
        'At ROOTS-AI™, we explore the science behind everyday health experiences — where biological mechanisms, human behavior, individual variation, and scientific uncertainty meet.',
        'Not to turn every symptom into a hidden disease.',
        'Not to present emerging research as established fact.',
        'But to ask better questions, examine the evidence, and make complexity understandable.',
      ],
    },
  ] satisfies PageZone[],
  /** Shown while no article has been approved for publication. */
  emptyState: {
    heading: 'Explore Our Insights',
    paragraphs: [
      'Our first evidence-informed articles are in preparation.',
      'As our library grows, you will find accessible, carefully reviewed perspectives on biological science, everyday health patterns, and responsible innovation.',
    ],
  },
  after: [
    {
      heading: 'Topics We Explore',
      kind: 'prose',
      items: [],
      blocks: [
        {
          label: 'Metabolism & Energy',
          paragraphs: ['How the body manages energy, responds to changing demands, and adapts to individual circumstances.'],
        },
        {
          label: 'Hunger & Satiety',
          paragraphs: ['The biological and behavioral influences on appetite, fullness, cravings, and eating patterns.'],
        },
        {
          label: 'Sleep & Recovery',
          paragraphs: ['What research reveals about sleep quality, restoration, and everyday functioning.'],
        },
        {
          label: 'Circadian Biology',
          paragraphs: ['How biological timing interacts with light exposure, meals, activity, and daily routines.'],
        },
        {
          label: 'Stress & Adaptation',
          paragraphs: ['How stress responses interact with behavior, recovery, and physiological regulation.'],
        },
        {
          label: 'The Gut–Brain Connection',
          paragraphs: [
            'What we know — and have yet to establish — about communication between the digestive system and the nervous system.',
          ],
        },
        {
          label: 'Science, AI & Responsible Health Technology',
          paragraphs: [
            'How emerging technologies may support understanding while respecting scientific validation, professional judgment, and human responsibility.',
          ],
        },
      ],
    },
    {
      heading: 'Evidence Before Certainty.',
      kind: 'prose',
      tone: 'limit',
      items: [],
      paragraphs: [
        'A compelling explanation is not necessarily a proven one.',
        'Our editorial approach distinguishes established findings from emerging hypotheses, associations from causation, and biological plausibility from demonstrated clinical outcomes.',
        'Each published article will identify its author, relevant sources, review date, and educational limitations.',
        'Because uncertainty should be explained, not hidden behind confident language.',
      ],
    },
    {
      heading: 'Better Questions. More Responsible Understanding.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'We are not building another collection of miracle solutions or universal health rules.',
        'We want to create a place where scientific ideas can be explored thoughtfully, challenged openly, and understood within their limits.',
        'Good science does not need exaggerated promises to be worth reading.',
      ],
    },
  ] satisfies PageZone[],
  ctas: [
    { label: 'Explore Our Research', href: '/research' },
    { label: 'Discover ROOTS-AI™', href: '/about' },
  ] satisfies Cta[],
  footnote:
    'ROOTS-AI™ Insights provides general educational information. Articles are not personalized medical advice, diagnosis, or treatment recommendations. Scientific understanding evolves, and content should be considered alongside its sources, limitations, and publication or review dates.',
};

// ----------------------------------------------------------------- /contact

export const CONTACT_PAGE = {
  kicker: 'ROOTS-AI™ / CONTACT',
  headline: 'Every Meaningful Connection Begins With a Conversation.',
  tagline: "Questions, ideas, collaborations, or support — we're here to listen.",
  intro:
    "Whether you're exploring ROOTS-AI™, seeking assistance, or interested in working together, we'd welcome hearing from you.",
  introMore: [
    'Choose the reason for your enquiry and share a few details. This helps us direct your message to the appropriate team.',
  ],
  help: [
    {
      heading: 'How Can We Help?',
      kind: 'prose',
      items: [],
      blocks: [
        {
          label: 'Product & Account Support',
          paragraphs: [
            'Questions about accessing the platform, completing your assessment, understanding report features, or resolving technical issues.',
          ],
        },
        {
          label: 'Privacy & Data Requests',
          paragraphs: ['Enquiries about your personal information, consent, privacy rights, or data-handling requests.'],
        },
        {
          label: 'Research & Academic Collaboration',
          paragraphs: ['Conversations with researchers, universities, and institutions interested in responsible scientific collaboration.'],
        },
        {
          label: 'Healthcare & Professional Enquiries',
          paragraphs: [
            "Questions from healthcare professionals and organizations exploring the platform's educational scope and potential future applications.",
          ],
        },
        {
          label: 'Business & Strategic Partnerships',
          paragraphs: ['Opportunities involving partnerships, institutional engagement, and responsible commercial collaboration.'],
        },
        { label: 'General Enquiries', paragraphs: ["For anything else you'd like to discuss."] },
      ],
    },
  ] satisfies PageZone[],
  form: {
    heading: 'Send Us a Message',
    name: 'Name',
    email: 'Email Address',
    message: 'Your Message',
    messageHelp: 'Tell us how we can help. Please avoid including sensitive medical details or unnecessary personal information.',
    limit: 'Maximum 2,000 characters.',
    consentLabel: 'Privacy Acknowledgment',
    consent:
      'I have read the Privacy Notice and understand that ROOTS-AI™ will use the information I submit to review and respond to my enquiry, as described in that notice.',
    submit: 'Send Message',
  },
  after: [
    {
      heading: 'Your Privacy Matters.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'Please share only the information necessary for your enquiry.',
        'This form is not intended for medical consultations, diagnosis, or the submission of medical records. Privacy-related requests will be handled through the applicable verification and privacy procedures.',
      ],
    },
    {
      heading: 'Important Safety Notice',
      kind: 'prose',
      tone: 'limit',
      items: [],
      paragraphs: [
        'This contact form is not monitored for medical emergencies.',
        'If you are experiencing a medical emergency or believe you may be in immediate danger, contact your local emergency services or seek urgent medical assistance.',
      ],
    },
  ] satisfies PageZone[],
  corporate: ['ROOTS-AI™', 'Medicine Before Symptoms™', 'ROOTS AI HEALTH SYSTEMS, Inc.', 'Delaware, United States'],
};

// ----------------------------------------------------------------- /assessment  (entry)

export const ASSESSMENT_PAGE = {
  kicker: 'ROOTS-AI™ / BIOLOGICAL ASSESSMENT',
  headline: 'Your Health Has a Story. Start With Yours.',
  tagline: 'A few thoughtful answers can help bring your everyday health patterns into clearer view.',
  intro:
    'Your ROOTS Biological Assessment™ explores self-reported experiences across seven interconnected health domains — including sleep, appetite, stress, metabolic patterns, and daily functioning.',
  introMore: ['There are no perfect answers. What matters is what reflects your experience.'],
  expect: {
    heading: 'What to Expect',
    blocks: [
      { label: '73 Questions. 13 Short Modules.', text: 'Designed to take approximately 10–12 minutes, although completion time varies.' },
      { label: 'Complete It at Your Own Pace.', text: "Save your progress, pause, and return securely when you're ready." },
      {
        label: 'Answer From Your Experience.',
        text: 'Unless a question specifies otherwise, think about your usual experience over the past four weeks.',
      },
      {
        label: 'Answer Honestly. Every Response Matters.',
        text: 'Choose the response that best reflects your experience. Where an N/A option is available, use it when the question does not apply to you. N/A is not treated as a zero score.',
      },
    ],
  },
  form: {
    heading: 'Before You Begin',
    emailLabel: 'Email Address',
    emailHelp:
      "We'll use your email to send a secure link for accessing or resuming your assessment, as described in our Privacy Notice.",
    ageLabel: 'Age Confirmation',
    age: 'I confirm that I am 18 years of age or older.',
    consentLabel: 'Privacy & Consent',
    consent: 'I have read the Privacy Notice and understand how my information will be processed to provide the assessment and report.',
    submit: 'Begin My Assessment',
  },
  boundaries: {
    heading: 'Understanding the Boundaries',
    paragraphs: [
      'Your responses are used to generate educational, questionnaire-derived wellness indicators. They do not establish a medical diagnosis or replace professional healthcare.',
      'This assessment is not monitored for emergencies. If you believe you may be in immediate danger, contact local emergency services.',
    ],
  },
  links: [
    { label: 'Privacy Notice', href: '/privacy' },
    { label: 'Terms of Use', href: '/terms' },
    { label: 'Medical Disclaimer', href: '/medical-disclaimer' },
    { label: 'AI Disclaimer', href: '/ai-disclaimer' },
  ],
  closing: 'ROOTS-AI™ — Medicine Before Symptoms™',
};

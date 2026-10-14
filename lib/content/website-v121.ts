/**
 * ROOTS-AI™ Website — Complete Revised Publication Candidate v1.21 (ROOTS_AI_Website_Complete_
 * Revised_Publication_Candidate_v1.21.pdf), transcribed as data.
 *
 * Every participant-facing sentence on the pages below comes from that document. The page
 * templates lay it out and add nothing. Wording is verbatim: no paraphrase, no abridgement and
 * no re-ordering. Page metadata (title / description) is not part of the document and stays as
 * C-04 §10 supplies it.
 *
 * Not published, because they are instructions to the editorial team rather than website copy:
 *   - Platform: "The seven stages below describe strategic capability themes; they must be
 *     mapped to the separately governed technical product roadmap before publication."
 *   - Example Report: "Any displayed numerical results must come from a verified fictional test
 *     case or be explicitly identified as non-calculated design placeholders."
 *   - The running page footer ("ROOTS-AI | Controlled publication candidate | …") and the
 *     document's final page, "Publication Closure Register — Internal Approval Requirements
 *     (Not Website Copy)".
 */

import { HEALTHCARE_PROFESSIONALS as C04_PROFESSIONALS, HOW_IT_WORKS as C04_HOW, PILOT as C04_PILOT, PLATFORM as C04_PLATFORM, RESEARCH as C04_RESEARCH, ABOUT as C04_ABOUT } from './c04-pages';
import type { PageContent } from './c04-pages';

// ----------------------------------------------------------------- /how-it-works

export const HOW_IT_WORKS: PageContent = {
  route: '/how-it-works',
  kicker: 'ROOTS-AI™ | HOW IT WORKS',
  headline: 'From Answers to Biological Intelligence',
  tagline: 'Your answers matter. How they are interpreted matters just as much.',
  intro:
    'Health is rarely explained by a single symptom or measurement. Sleep, stress, appetite, metabolic regulation, and other aspects of daily functioning can interact in ways that are difficult to understand when viewed separately.',
  introMore: [
    'ROOTS-AI™ brings these self-reported patterns into a structured, connected view — using predefined analytical rules, controlled interpretation, and clearly defined limits on artificial intelligence.',
    'The rules determine the findings. AI helps explain them.',
  ],
  ctas: [
    { label: 'Start Your Assessment', href: '/assessment' },
    { label: 'View Example Report', href: '/example-report' },
  ],
  bullets: [],
  meta: C04_HOW.meta,
  zones: [
    {
      eyebrow: 'Four Stages. One Governed Process.',
      heading: '01 — Understand Your Patterns',
      kind: 'prose',
      noIndex: true,
      sub: 'Your experience is the starting point.',
      lead: 'Complete a structured 73-question assessment exploring seven interconnected domains:',
      items: [
        'Hunger and appetite regulation',
        'Metabolic regulation',
        'Safety and immune-related responses',
        'Inflammatory patterns',
        'Sleep and recovery',
        'Circadian timing',
        'Stress responses',
      ],
      closing: [
        'Your responses provide the information used to generate your report. They are not treated as direct measurements of underlying biological mechanisms.',
      ],
    },
    {
      heading: '02 — Analyze with Defined Rules',
      kind: 'prose',
      noIndex: true,
      sub: 'Consistent calculations. No AI guesswork.',
      items: [],
      paragraphs: [
        'Your answers are validated and processed through a deterministic scoring system.',
        'Approved rules calculate domain scores and derived indicators, identify eligible findings and drivers, and determine confidence and information sufficiency.',
        'Missing and non-applicable responses are handled according to defined rules. Insufficient information is acknowledged rather than replaced with invented findings.',
        'Neither the AI model nor the website interface can independently recalculate or override these results.',
      ],
    },
    {
      heading: '03 — Explain with Governed AI',
      kind: 'prose',
      noIndex: true,
      sub: 'Clearer language. Not independent medical judgment.',
      items: [],
      paragraphs: [
        'Once the analytical results are established, governed AI may help express approved explanations in language that is easier to understand.',
        'Its role is deliberately limited.',
        'AI cannot change scores, classifications, selected drivers, confidence, unavailable results, or the approved report structure. It cannot introduce unsupported personal facts or conclusions.',
        'The purpose is to make structured information understandable without allowing the explanation to become a new source of evidence.',
      ],
    },
    {
      heading: '04 — Explore Your Biological Intelligence Report™',
      kind: 'prose',
      noIndex: true,
      sub: 'One connected view of your reported patterns.',
      paragraphs: ['Your report brings the approved findings together in a structured, educational format.'],
      lead: 'It may help you explore:',
      items: [
        'How your reported patterns appear across the seven domains',
        'Which questionnaire-derived factors the defined rules identify as relevant (not proven causes)',
        'Where reported patterns may overlap',
        'Which reported strengths and rule-identified protective factors are presented (not verified biological protection)',
        'Where information is incomplete or uncertain',
        'Which approved educational actions may support further reflection',
      ],
      closing: [
        'The interactive web report and downloadable PDF are generated from the same controlled report record, preserving consistency across both formats.',
        'One assessment. One governed interpretation. One consistent report.',
      ],
    },
    {
      heading: 'What AI Does',
      kind: 'prose',
      span: 6,
      tone: 'affirm',
      items: [],
      paragraphs: [
        'AI may assist in expressing approved findings clearly, using controlled explanatory content.',
        "It helps communicate information already established by the system's predefined rules.",
      ],
    },
    {
      heading: 'What AI Does Not Do',
      kind: 'prose',
      span: 6,
      tone: 'limit',
      lead: 'AI does not independently:',
      items: [
        'Calculate or modify scores, classifications, drivers, or confidence',
        'Replace missing information or unavailable results',
        'Invent personal facts or biological findings',
        'Diagnose disease or predict clinical outcomes',
        'Prescribe treatment or medication',
        'Interpret laboratory results',
        'Change the approved report structure',
      ],
      closing: ['AI supports understanding. It does not determine your biological results.'],
    },
    {
      heading: 'Privacy and Accountability',
      kind: 'prose',
      sub: 'Your health information deserves careful handling.',
      items: [],
      paragraphs: [
        'ROOTS-AI™ is designed around controlled access, defined data-handling rules, version tracking, and auditability.',
        'Our privacy documentation explains how information is collected, used, protected, retained, and managed, including applicable user rights.',
      ],
    },
    {
      heading: "What Your Report Means — And What It Doesn't",
      kind: 'prose',
      tone: 'limit',
      items: [],
      paragraphs: [
        'ROOTS-AI™ provides an educational, non-diagnostic interpretation of self-reported health patterns.',
        'The assessment does not directly measure cellular activity, hormones, inflammation, genetic function, or other underlying biological mechanisms. Its findings are based on submitted answers and predefined interpretation rules, not laboratory confirmation or clinical diagnosis.',
        'The report does not replace professional medical evaluation, appropriate testing, or individualized medical care.',
        'Understanding patterns is a starting point. Not a diagnosis.',
      ],
    },
  ],
  outro: {
    heading: 'Start with Your Own Patterns',
    text: 'A clearer understanding begins with better questions — and a process that respects the limits of its evidence.',
  },
};

// ----------------------------------------------------------------- /platform

const STAGE = (heading: string, sub: string, text: string) => ({
  heading,
  kind: 'prose' as const,
  noIndex: true,
  sub,
  items: [],
  paragraphs: [text],
});

export const PLATFORM: PageContent = {
  route: '/platform',
  kicker: 'ROOTS-AI™ | PLATFORM',
  headline: 'One Human System. A Deeper Understanding of Health.',
  tagline: 'Health is connected. Understanding it should be, too.',
  intro:
    'The human body does not operate in isolated departments. Sleep, metabolism, stress, immune responses, and daily functioning influence one another. Yet the information used to understand health is often fragmented.',
  introMore: [
    'ROOTS-AI™ is building a governed health intelligence platform designed to bring different dimensions of human health into a more connected, understandable view.',
    'We begin with structured self-reported patterns. Our long-term vision extends toward richer biological context, longitudinal understanding, and responsible integration across healthcare environments.',
  ],
  ctas: [
    { label: 'Start Your Assessment', href: '/assessment' },
    { label: 'Explore How It Works', href: '/how-it-works' },
  ],
  bullets: [],
  meta: C04_PLATFORM.meta,
  zones: [
    {
      heading: 'How the Platform Evolves',
      kind: 'prose',
      noIndex: true,
      sub: 'One foundation. Seven stages of evolution. A commitment to evidence throughout.',
      items: [],
    },
    STAGE(
      '01 — Understand',
      'Begin with the patterns that matter.',
      'Our initial platform uses a structured assessment and predefined analytical rules to identify eligible patterns across seven interconnected health domains. Governed AI helps communicate approved findings clearly, without independently determining or changing them.',
    ),
    STAGE(
      '02 — Connect',
      'Bring relevant information into context.',
      'Future capabilities are designed to incorporate additional health information and qualified measurements, helping build a more complete picture over time.',
    ),
    STAGE(
      '03 — Interpret',
      'Look beyond isolated findings.',
      'As the platform evolves, governed intelligence will explore eligible relationships, information gaps, and differences across available sources — while preserving uncertainty and the limits of evidence.',
    ),
    STAGE(
      '04 — Personalize',
      'Recognize individual complexity.',
      'Future development aims to support a more contextual understanding of individual circumstances, goals, and changes over time.',
    ),
    STAGE(
      '05 — Coordinate',
      'Support continuity across disciplines.',
      "The platform's long-term architecture is intended to help authorized healthcare professionals work with more connected information while preserving clinical responsibility.",
    ),
    STAGE(
      '06 — Integrate',
      'Extend understanding across care environments.',
      'Future institutional capabilities aim to improve information continuity through governed interoperability and appropriate oversight.',
    ),
    STAGE(
      '07 — Advance',
      'Explore what deeper intelligence may make possible.',
      'Long-term research and development will investigate more sophisticated approaches to understanding human health, subject to scientific validation and appropriate authorization.',
    ),
    {
      heading: 'Intelligence With Boundaries',
      kind: 'prose',
      tone: 'limit',
      sub: 'Technology should make evidence clearer, not stronger than it is.',
      items: [],
      paragraphs: [
        'ROOTS-AI™ is designed around defined analytical rules, controlled AI responsibilities, data provenance, privacy safeguards, and traceable interpretation. Additional information does not automatically establish biological mechanisms, clinical conclusions, or future outcomes. Every capability must be evaluated within its intended use and evidentiary limits.',
      ],
    },
    {
      heading: 'Built Progressively. Validated Responsibly.',
      kind: 'prose',
      items: [],
      blocks: [
        {
          label: 'Initial platform',
          paragraphs: [
            'A structured health assessment and governed Biological Intelligence Report™, subject to completion of verification and release approval.',
          ],
        },
        {
          label: 'Future development',
          paragraphs: [
            'Additional capabilities will be introduced progressively, following appropriate technical, scientific, governance, and regulatory review. Future-stage descriptions represent development intentions, not claims of current availability or established clinical effectiveness.',
          ],
        },
      ],
    },
  ],
  outro: {
    heading: 'Understanding Begins with Connection.',
    text: 'Better questions. Clearer context. Responsible intelligence.',
  },
};

// ----------------------------------------------------------------- /research

export const RESEARCH: PageContent = {
  route: '/research',
  kicker: 'ROOTS-AI™ / RESEARCH',
  headline: 'The Future of Health Begins With Better Questions.',
  tagline: 'Biology is connected. Evidence must be earned.',
  intro:
    'The human body does not organize itself into medical specialties. Sleep, stress, metabolism, behavior, and recovery interact continuously. Yet much of what we know about health comes from studying these dimensions separately.',
  introMore: [
    'ROOTS-AI™ is exploring a different question:',
    'What might we understand if we studied human health as a connected system — without losing the scientific discipline that makes understanding trustworthy?',
  ],
  ctas: [
    { label: 'Explore Research Collaboration', href: '/contact' },
    { label: 'Contact ROOTS-AI™', href: '/contact' },
  ],
  bullets: [],
  meta: C04_RESEARCH.meta,
  zones: [
    {
      heading: 'Curiosity Is the Beginning. Not the Evidence.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'A pattern is not a diagnosis. An association is not a cause. A promising observation is not a validated outcome.',
        'Our research direction is to investigate how structured health information may help reveal meaningful relationships, identify uncertainty, and support a more integrated understanding of human health.',
        'We are interested not only in what the data suggests, but also in where it falls short. Because knowing the limits of an observation is part of knowing its value.',
      ],
    },
    {
      heading: 'Research That Respects the Individual.',
      kind: 'prose',
      sub: 'Scientific progress should never come at the expense of personal autonomy.',
      lead: 'Our research framework is built around clear boundaries:',
      items: [],
      blocks: [
        {
          label: 'Consent is a choice.',
          paragraphs: [
            'Research participation requires separate, informed consent. Declining research participation must not restrict access to ordinary platform services.',
          ],
        },
        {
          label: 'Privacy is a responsibility.',
          paragraphs: [
            'Research use is subject to data minimization, controlled access, and applicable ethical and privacy requirements.',
          ],
        },
        {
          label: 'Uncertainty belongs in the findings.',
          paragraphs: ['Limitations, potential bias, and alternative explanations must be acknowledged.'],
        },
        {
          label: 'Oversight comes before activity.',
          paragraphs: [
            'Research must receive the appropriate review, permissions, and governance before it begins. Pseudonymized data is not described as anonymous unless the methodology justifies that claim.',
          ],
        },
      ],
    },
    {
      heading: 'From Exploration to Validation.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'ROOTS-AI™ aims to support responsibly designed research and pilot studies that examine the feasibility, consistency, and potential usefulness of questionnaire-derived health indicators. Such indicators are not clinical endpoints, diagnostic measures, or validated predictors of disease unless independently supported by appropriate evidence.',
        'Research use will be governed separately from routine platform services. Any authorized data export will require a documented specification that excludes direct identifiers and report narratives.',
        'Findings will be communicated with their limitations, without turning early signals into premature clinical claims.',
      ],
    },
    {
      heading: 'Science Advances Through Collaboration.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'The questions we are asking cross traditional disciplinary boundaries. We welcome thoughtful dialogue with universities, researchers, healthcare institutions, and scientific collaborators interested in studying human health with greater context and stronger methodological discipline.',
        'Potential collaborations will be developed through clearly defined objectives, appropriate approvals, and shared scientific accountability.',
        'The goal is not to confirm what we already believe. It is to discover what the evidence can actually support.',
      ],
    },
    {
      heading: 'Understanding Is Earned.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'More data does not automatically produce better science. More sophisticated technology does not automatically produce stronger evidence. And a compelling explanation does not make a finding true.',
        'At ROOTS-AI™, our ambition is to advance biological intelligence without allowing ambition to outrun validation.',
        'Because the future of health deserves more than convincing answers. It deserves trustworthy ones.',
      ],
    },
  ],
};

// ----------------------------------------------------------------- /about

export const ABOUT: PageContent = {
  route: '/about',
  kicker: 'ROOTS-AI™ / ABOUT',
  headline: 'Medicine Before Symptoms™',
  tagline: 'The body has a story long before medicine gives it a name.',
  intro:
    'A person can feel exhausted while routine results remain within reference ranges. Weight can become harder to manage despite sustained effort. Sleep may stop feeling restorative. Appetite, energy, and recovery can change in ways that are difficult to explain.',
  introMore: [
    'None of these experiences alone establishes a disease. But each can raise a question worth asking.',
    'Healthcare has extraordinary tools for diagnosing and treating illness. Yet the experience of being human rarely fits neatly into one test, one specialty, or one appointment.',
  ],
  ctas: [
    { label: 'Explore Our Platform', href: '/platform' },
    { label: 'Discover How It Works', href: '/how-it-works' },
  ],
  bullets: [],
  meta: C04_ABOUT.meta,
  zones: [
    {
      heading: 'ROOTS-AI™ was founded around a conviction:',
      kind: 'prose',
      items: [],
      paragraphs: ['We should not have to reduce a person to isolated symptoms to begin understanding their health.'],
    },
    {
      eyebrow: 'The Thinking Behind ROOTS-AI™',
      heading: 'A Different Question Led Us Here.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'ROOTS-AI™ did not begin with a desire to add artificial intelligence to healthcare. It grew from years of experience across health, nutrition, and wellness — and a recurring observation: what people experience does not always fit neatly into what individual measurements can explain.',
        'People do not experience their bodies as separate departments. They experience fatigue alongside poor sleep. Changing appetite alongside stress. Weight difficulties alongside shifts in routine, recovery, and daily functioning.',
        'The question was not whether a single technology could explain all of this. It was whether these experiences could be organized into a more coherent picture, without claiming certainty where none exists.',
        'That question became the foundation of ROOTS-AI™.',
      ],
    },
    {
      eyebrow: 'Our Mission',
      heading: 'Make Health Intelligence Understandable. And Worth Trusting.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'We are building ROOTS-AI™ to help people understand reported health patterns in a clearer, more connected way. Our mission is to make complex health information accessible while respecting the distinction between self-reported experiences, analytical indicators, biological measurements, and clinical evidence.',
        'We want people to leave with better questions, greater clarity, and realistic educational next steps.',
        'Not with a diagnosis generated from a questionnaire.',
        'Not with certainty manufactured by artificial intelligence.',
        'With understanding that respects what is known — and what is not.',
      ],
    },
    {
      eyebrow: 'Our Philosophy',
      heading: 'One Human Being. One Connected Picture.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'Sleep influences how we function. Stress can shape appetite and daily behavior. Activity, nutrition, circadian timing, and recovery interact with individual circumstances. Understanding these relationships requires context.',
        'ROOTS-AI™ begins by organizing self-reported patterns across seven interconnected health domains. The goal is not to force every experience into one explanation. It is to make eligible relationships easier to explore, recognize strengths, and identify where uncertainty remains.',
        'Biological complexity deserves more than a collection of disconnected scores.',
      ],
    },
    {
      eyebrow: 'How We Build Trust',
      heading: 'Intelligence Is Only Valuable When It Knows Its Limits.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'Artificial intelligence can make complex information easier to communicate. It can also make weak conclusions sound convincing. That distinction matters.',
        'Our initial platform uses structured assessments and predefined analytical rules to establish eligible findings. Governed AI supports the communication of approved interpretations. It does not independently determine or change the underlying scores, classifications, or findings.',
        'We believe transparency, privacy, scientific discipline, and clear limits are not features to add later. They are part of what makes health intelligence responsible.',
      ],
    },
    {
      eyebrow: 'Our Vision',
      heading: 'From Individual Patterns to a More Connected Future.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'ROOTS-AI™ begins with educational interpretation of self-reported health information. Our long-term vision extends toward responsibly connecting additional biological information, individual context, and changes over time.',
        'We aim to explore how more coherent health intelligence could support individuals, scientific research, and healthcare environments—as each capability earns the evidence, validation, oversight, and authorization it requires.',
        'The ambition is substantial. But progress cannot be measured only by how sophisticated a system becomes. It must also be measured by how reliably it knows when not to draw a conclusion.',
      ],
    },
    {
      heading: 'What We Believe',
      kind: 'prose',
      items: [],
      blocks: [
        { label: 'The person comes before the data.', paragraphs: ['A score can summarize a pattern. It cannot define a human being.'] },
        { label: 'Evidence comes before claims.', paragraphs: ['A plausible mechanism is not proof of a clinical outcome.'] },
        { label: 'Clarity matters.', paragraphs: ['Complex science should become understandable without becoming misleading.'] },
        { label: 'Uncertainty deserves honesty.', paragraphs: ['Missing information should remain visible, not be filled with assumptions.'] },
        { label: 'Progress requires accountability.', paragraphs: ['Every new capability carries responsibilities beyond its technical performance.'] },
      ],
    },
    {
      heading: 'A U.S. Company. A Global Perspective.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'ROOTS-AI™ is developed by ROOTS AI HEALTH SYSTEMS, Inc., a Delaware-incorporated U.S. company with a presence in Malaysia. Our perspective is international, but the problem we are addressing is deeply personal. Across countries and healthcare systems, people face a similar challenge: making sense of information about their health that often arrives in fragments. We believe a more connected approach can help make that information easier to understand—while preserving the essential role of healthcare professionals, scientific evidence, and individual choice.',
      ],
    },
    {
      heading: 'The Beginning Matters.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'For generations, medicine has advanced our ability to recognize, investigate, and treat disease. That progress is indispensable.',
        'We believe another important frontier lies in understanding the individual more fully—including the patterns, circumstances, and questions that may exist before a diagnosis enters the conversation.',
        'Not every change is a warning.',
        'Not every pattern points to disease.',
        'And not every question has an immediate answer.',
        'But every person deserves information that is thoughtful, clear, and honest about its limits.',
        'The future of health will not be defined by how much we know about disease alone—but by how responsibly we learn to understand the person before it.',
      ],
    },
  ],
  outro: { heading: 'ROOTS-AI™', text: 'Medicine Before Symptoms™' },
};

// ----------------------------------------------------------------- /healthcare-professionals

export const HEALTHCARE_PROFESSIONALS: PageContent = {
  route: '/healthcare-professionals',
  kicker: 'ROOTS-AI™ / FOR PROFESSIONALS',
  headline: 'A Better Conversation Begins With Better Context.',
  tagline: 'The patient brings the experience. The professional brings clinical judgment. The information between them deserves clarity.',
  intro: 'A person may arrive at a consultation carrying months of fragmented observations.',
  introMore: [
    'Disrupted sleep. Persistent fatigue. Changes in appetite. Difficulty managing weight. Stress that seems to affect everything.',
    'These experiences matter. But they rarely arrive neatly organized.',
    'ROOTS-AI™ is designed to help individuals bring their self-reported health patterns into a structured, transparent educational report that can be shared with a qualified healthcare professional.',
    'Not to make the clinical decision. To make the conversation more informed.',
  ],
  ctas: [
    { label: 'Explore the Example Report', href: '/example-report' },
    { label: 'Learn How ROOTS-AI™ Works', href: '/how-it-works' },
  ],
  bullets: [],
  meta: C04_PROFESSIONALS.meta,
  zones: [
    {
      eyebrow: 'Context Before Conclusions',
      heading: 'More Than a Symptom List.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'A symptom may deserve attention without revealing its cause.',
        'A questionnaire score may summarize reported experiences without establishing a diagnosis.',
        'And two patterns appearing together do not prove that one caused the other.',
        'The ROOTS Biological Intelligence Report™ organizes eligible findings across seven interconnected health domains, making it easier to review what the participant reported, what the assessment identified, and where information remains incomplete.',
        'Its purpose is to provide context for discussion, not to determine clinical significance.',
      ],
    },
    {
      eyebrow: 'What Professionals Can Review',
      heading: 'The Information Behind the Interpretation.',
      kind: 'prose',
      items: [],
      blocks: [
        {
          label: 'Reported Patterns',
          paragraphs: ["A structured overview of the participant's responses, with the original answers available for review."],
        },
        {
          label: 'Questionnaire-Derived Indicators',
          paragraphs: [
            'Scores and classifications that summarize eligible reported patterns, accompanied by their intended meaning and limitations.',
          ],
        },
        {
          label: 'Data Quality & Confidence',
          paragraphs: [
            'Information about response completeness, consistency, and other approved data-quality factors.',
            'ROOTS Confidence™ describes confidence within the assessment framework. It does not measure diagnostic certainty, the probability of disease, or the clinical accuracy of an inferred biological mechanism.',
          ],
        },
        {
          label: 'Relevant Context',
          paragraphs: ['Approved summaries of prominent patterns, reported strengths, and areas that may warrant further discussion.'],
        },
        {
          label: 'Educational Priorities',
          paragraphs: [
            'Non-prescriptive guidance intended to support conversations about daily routines, nutrition, activity, and recovery.',
          ],
        },
        {
          label: 'Questions for Further Evaluation',
          paragraphs: [
            'Optional discussion topics that may help a qualified professional decide whether additional assessment or laboratory investigation is appropriate.',
          ],
        },
      ],
    },
    {
      eyebrow: 'Clear Rules. Governed Explanations.',
      heading: 'Interpretation Must Remain Accountable.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'ROOTS-AI™ separates the calculation of report findings from the language used to communicate them.',
        'Predefined analytical rules determine eligible scores, classifications, and report outputs.',
        'Governed AI may express approved explanations, but it cannot independently change the underlying findings or introduce unsupported clinical conclusions.',
        'This separation supports transparency and consistency without implying that questionnaire-derived indicators are clinically validated measurements.',
      ],
    },
    {
      eyebrow: 'Clinical Judgment Remains Essential',
      heading: 'An Educational Report Is Not a Clinical Verdict.',
      kind: 'prose',
      tone: 'limit',
      items: [],
      paragraphs: [
        'ROOTS-AI™ does not diagnose disease, determine the cause of symptoms, prescribe treatment, or independently interpret laboratory results.',
        'Its proprietary questionnaire indicators are not validated probabilities of disease or future clinical outcomes.',
        'Suggested laboratory discussions are optional prompts, not test orders.',
        'Clinical interpretation, investigation, and treatment decisions remain the responsibility of qualified healthcare professionals.',
        "The report can organize a person's answers. It cannot replace the professional who understands their clinical significance.",
      ],
    },
    {
      heading: 'Designed for Responsible Dialogue',
      kind: 'prose',
      items: [],
      paragraphs: [
        'A useful consultation depends on more than the amount of information available.',
        'It depends on whether that information can be examined, questioned, and understood within its limitations.',
        "ROOTS-AI™ aims to make the participant's reported experience easier to review, without adding another source of unearned clinical authority.",
      ],
    },
  ],
  outro: {
    heading: 'Better Context. Independent Judgment.',
    text: "Good healthcare does not begin with an algorithm's certainty. It begins with careful questions, reliable evidence, and professional responsibility.",
  },
  footnote:
    'ROOTS-AI™ is an educational wellness platform. Its initial report is based on self-reported information and is not a diagnostic device, clinical decision-support system, validated disease-risk assessment, or substitute for professional healthcare.',
};

// ----------------------------------------------------------------- /pilot  (Free Beta)

export const PILOT: PageContent = {
  route: '/pilot',
  kicker: 'ROOTS-AI™ / FREE BETA',
  headline: 'Your Health Is More Than a Number on a Scale.',
  tagline: 'What if you could see your everyday health patterns in a more connected way?',
  intro:
    'You may be eating more carefully, moving more, or trying to improve your sleep — yet still feel that something is missing from the picture.',
  introMore: [
    'Perhaps your weight is difficult to manage.',
    'Your energy changes throughout the day.',
    'Your sleep does not always leave you feeling restored.',
    'Or stress and appetite seem to move together.',
    'These experiences do not necessarily indicate a medical condition. But understanding how they appear alongside one another can be a useful starting point.',
    'The ROOTS-AI™ Free Beta invites you to explore that starting point.',
  ],
  ctas: [{ label: 'Join the Free Beta', href: '/assessment' }],
  bullets: [],
  meta: C04_PILOT.meta,
  zones: [
    {
      eyebrow: "What You'll Explore",
      heading: 'Seven Domains. One Connected View.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'The beta uses a structured assessment to organize self-reported patterns involving metabolism, hunger and satiety, sleep, circadian timing, stress, inflammation-related experiences, and biological safety signals.',
        'Rather than looking at each answer in isolation, ROOTS-AI™ brings eligible findings into an educational report designed to make your responses easier to understand.',
        'Not a diagnosis. A clearer view of what you reported.',
      ],
    },
    {
      heading: 'What You Receive',
      kind: 'prose',
      items: [],
      blocks: [
        {
          label: 'A Structured Health Assessment',
          paragraphs: ['73 questions across 13 short modules, designed to explore relevant everyday health patterns.'],
        },
        {
          label: 'A Biological Intelligence Report™',
          paragraphs: [
            'An individualized educational summary based on your submitted answers and predefined analytical rules, presenting eligible findings, reported strengths, areas for attention, and practical next steps.',
          ],
        },
        {
          label: 'Clear Explanations',
          paragraphs: ['Governed AI helps communicate approved findings without independently changing the underlying results.'],
        },
        {
          label: 'Time to Complete It Your Way',
          paragraphs: [
            'Designed to take approximately 10–12 minutes, although completion time varies.',
            'You can save your progress, pause, and return later.',
          ],
        },
        {
          label: 'Free Participation',
          paragraphs: ['There is no payment required for participants accepted into the approved beta cohort.'],
        },
      ],
    },
    {
      heading: 'Who Can Participate?',
      kind: 'prose',
      items: [],
      paragraphs: [
        'The Free Beta is intended for adults aged 18 or older, subject to local eligibility requirements and cohort availability.',
        'You do not need a diagnosis or a particular health condition to take part.',
        'Participation is voluntary.',
      ],
    },
    {
      heading: 'Your Information. Your Choice.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'We recognize that health-related information deserves careful handling.',
        'Before participating, you will be able to review the applicable Privacy Notice and consent information.',
        'Feedback about your experience may help us improve the usability and clarity of the platform.',
        'Participation in any separate research activity requires its own explicit consent. Joining the beta does not automatically enroll you in research.',
        'Withdrawal and data-handling requests are governed by the applicable Privacy Notice.',
      ],
    },
    {
      heading: 'What the Beta Cannot Tell You',
      kind: 'prose',
      tone: 'limit',
      items: [],
      paragraphs: [
        'ROOTS-AI™ does not diagnose disease, measure your underlying biology directly, or determine why a symptom is occurring.',
        'Its questionnaire-derived indicators are not validated probabilities of disease or future outcomes.',
        'The report does not replace medical evaluation, testing, or treatment. Persistent or concerning symptoms should be discussed with a qualified healthcare professional.',
      ],
    },
    {
      heading: 'Help Shape a More Understandable Future for Health.',
      kind: 'prose',
      items: [],
      paragraphs: [
        'This beta is an early step toward making health information more connected, accessible, and responsibly explained.',
        'Your participation can help us learn whether the experience is clear, useful, and practical for real people.',
        'You bring your experience. We provide a structured way to explore it.',
      ],
    },
  ],
  outro: { text: 'Free for eligible participants · Adults 18+ · Educational, not diagnostic' },
  footnote:
    'ROOTS-AI™ provides educational wellness information based on self-reported answers. It is not a medical device, diagnostic service, or substitute for qualified healthcare professionals. Beta participation is subject to eligibility, availability, and applicable consent and privacy terms.',
};

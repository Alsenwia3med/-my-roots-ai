/**
 * ROOTS-AI™ Website — Complete Revised Publication Candidate v1.21, legal notices (Privacy
 * Notice, Medical Disclaimer, Terms of Service, AI Disclaimer), transcribed as data.
 *
 * Wording is verbatim from that document: no paraphrase, no abridgement, no re-ordering. The
 * version and effective-date lines are printed exactly as the document prints them. The Cookie
 * Notice is not part of the document and stays in ./c04-legal.ts.
 *
 * Link labels in the "Related Notices" lines follow the document ("Terms of Use", "Privacy
 * Notice", …); the destinations are the existing notice routes.
 */

import type { LegalDocument } from './c04-legal';

const CORPORATE_ROOTS: LegalDocument['corporate'] = {
  heading: 'ROOTS-AI™',
  paragraphs: ['Medicine Before Symptoms™', 'ROOTS AI HEALTH SYSTEMS, Inc.', 'Delaware, United States'],
};

// ----------------------------------------------------------------- Privacy Notice

export const PRIVACY: LegalDocument = {
  route: '/privacy',
  title: 'Privacy Notice',
  kicker: 'ROOTS-AI™ / LEGAL',
  effective: {
    line: 'Version: 1.2 — Publication Candidate; Legal and Operational Sign-off Required. Effective Date: To be confirmed upon publication.',
  },
  intro: [
    'ROOTS-AI™ recognizes that the information you share through a biological assessment may be personal, sensitive, and connected to your health and everyday experiences.',
    'This Privacy Notice explains how we collect, use, access, disclose, protect, retain, and manage personal data when you use our Phase 1 platform.',
  ],
  blocks: [
    {
      heading: 'Who We Are',
      paragraphs: [
        'ROOTS-AI™ is an educational biological assessment and reporting platform owned and operated by ROOTS AI HEALTH SYSTEMS, Inc., a corporation incorporated in Delaware, United States. ROOTS AI HEALTH SYSTEMS, Inc. is the primary entity responsible for the platform and determines the purposes and essential means of processing personal data in connection with its services.',
        'HOLLY7X Sdn. Bhd., a Malaysian affiliated company, provides operational and administrative support under the direction of ROOTS AI HEALTH SYSTEMS, Inc.',
        'Authorized HOLLY7X personnel may access personal data, including assessment-related information, where necessary for their assigned responsibilities and subject to applicable confidentiality, security, contractual, and data-protection requirements.',
        'HOLLY7X Sdn. Bhd. is not authorized to use ROOTS-AI™ personal data for independent purposes merely because the companies share common ownership.',
        'Each entity remains subject to any data-protection obligations applicable to its actual processing activities.',
        'This notice applies to the ROOTS-AI™ Phase 1 website, assessment, secure access functions, educational reports, and associated support services.',
      ],
    },
    {
      heading: 'Personal Data We Collect',
      paragraphs: ['Depending on how you interact with ROOTS-AI™, we may collect or generate the following information.'],
      subs: [
        {
          label: 'Account and Contact Information',
          paragraphs: [
            'Email addresses, account identifiers, authentication-related records, and information submitted through contact or support forms.',
          ],
        },
        {
          label: 'Assessment Information',
          paragraphs: [
            'Responses to the 73-question assessment, including self-reported wellness experiences, lifestyle patterns, health-related information, and physical measurements provided through the questionnaire.',
          ],
        },
        {
          label: 'Generated Information',
          paragraphs: [
            'Questionnaire-derived indicators, domain scores, classifications, confidence-related information, approved educational explanations, and generated reports.',
          ],
        },
        {
          label: 'Consent and Preference Records',
          paragraphs: ['Records of privacy acknowledgments, required permissions, optional research choices, and consent withdrawals.'],
        },
        {
          label: 'Technical and Security Information',
          paragraphs: [
            'Device and browser information, authentication events, access logs, audit records, and information necessary to protect the platform.',
          ],
        },
        {
          label: 'Support Communications',
          paragraphs: ['Information you provide when requesting assistance or exercising privacy rights.'],
        },
        {
          label: 'Website Analytics',
          paragraphs: ['Limited information about public website use where analytics are enabled and legally permitted.'],
        },
      ],
      closing: [
        'Most assessment information is provided directly by you. Other information is generated through approved processing rules or collected automatically for technical and security purposes.',
        'Information marked as mandatory is required for the relevant service function. Without it, we may be unable to provide secure access, save an assessment, or generate a report.',
        'Optional information and optional research participation are identified separately.',
        'Please do not submit emergency information, medical records, or unnecessary sensitive details through general contact forms.',
      ],
    },
    {
      heading: 'Why We Process Personal Data',
      paragraphs: ['We process personal data for defined purposes, including:'],
      list: [
        'Providing and administering the ROOTS-AI™ assessment and educational reporting service.',
        'Creating secure access links and enabling assessment saving and resumption.',
        'Validating questionnaire responses and generating approved indicators and reports.',
        'Maintaining authentication, security, service integrity, and audit records.',
        'Responding to enquiries, support requests, and privacy requests.',
        'Investigating technical problems and improving service reliability.',
        'Meeting applicable legal, regulatory, and security obligations.',
        'Conducting separately authorized research or pilot analysis.',
      ],
      closing: [
        'The legal basis or authority for each activity depends on the purpose, the nature of the information, and applicable law.',
        'Where consent is required, we seek it through an appropriate process. Consent for one purpose does not automatically authorize unrelated processing.',
        'Participation in the assessment does not constitute consent to optional research.',
      ],
    },
    {
      heading: 'Sensitive Personal Data',
      paragraphs: [
        'Assessment responses and identifiable wellness-related information may constitute sensitive personal data under applicable law. Such information can reveal personal health-related experiences, circumstances, or patterns and therefore requires additional protection.',
        'We process sensitive personal data only for specified purposes and under applicable legal conditions, including explicit consent where required.',
        'Access is restricted to authorized roles with a documented operational need.',
        'ROOTS-AI™ provides educational wellness information. It does not provide medical diagnosis, treatment, prescriptions, or clinical monitoring.',
      ],
    },
    {
      heading: 'Research and Optional Participation',
      paragraphs: [
        'Research participation is separate from the ordinary assessment service. Research participation is optional. Declining research consent does not prevent access to the assessment service.',
        'Where research or pilot analysis is offered, participants receive information about the proposed activity and any required separate consent process.',
        'Research-related processing must follow documented purpose limitations, access restrictions, data-minimization requirements, and applicable legal or ethics obligations.',
        'Approved research exports exclude direct identifiers, authentication information, and report narratives.',
        'Where permitted, research information may be pseudonymized or de-identified according to the approved research specification.',
        'Pseudonymized information is not necessarily anonymous and may remain personal data under applicable law.',
        'Research-related retention, sharing, withdrawal, and participant rights are governed by the relevant research documentation and applicable requirements.',
        'Participation in a pilot or research activity does not establish clinical validation of the platform.',
      ],
    },
    {
      heading: 'Service Providers, Malaysian Operations and International Transfers',
      paragraphs: [],
      subs: [
        {
          label: 'Malaysian Operations',
          paragraphs: [
            'ROOTS AI HEALTH SYSTEMS, Inc. remains the primary entity responsible for the ROOTS-AI™ platform.',
            'HOLLY7X Sdn. Bhd. supports designated operational, administrative, technical, or security activities under the direction of the American company.',
            'Authorized HOLLY7X personnel may access personal data only to perform assigned platform-related responsibilities.',
            'Such access must be subject to appropriate permissions, confidentiality obligations, security controls, and documented arrangements.',
            'HOLLY7X is not independently authorized to reuse assessment information for its own marketing, commercial activities, or unrelated purposes.',
          ],
        },
        {
          label: 'Service Providers',
          paragraphs: [
            'We may engage approved providers for hosting, authentication, email delivery, security, technical operations, and governed AI-language services.',
            'Providers are permitted to process information only within their authorized scope and subject to appropriate contractual, technical, and organizational safeguards.',
            'Identifiable assessment information is not permitted to be disclosed to an AI-language provider unless the approved configuration, agreements, minimization controls, and applicable legal requirements allow it.',
          ],
        },
        {
          label: 'International Transfers',
          paragraphs: [
            "The platform's operations may involve personal-data access or processing across national borders, including between the United States and Malaysia.",
            'Such activities must satisfy applicable international-transfer requirements, including relevant legal conditions, recipient safeguards, and documented assessments where required.',
            'Common ownership does not independently authorize unrestricted international sharing of personal data.',
          ],
        },
      ],
    },
    {
      heading: 'Artificial Intelligence and Automated Processing',
      paragraphs: [
        'ROOTS-AI™ separates approved deterministic calculations from AI-assisted explanatory language. Defined rules calculate questionnaire-derived scores, classifications, and other approved outputs.',
        'Governed AI may assist in expressing approved information in understandable educational language using permitted, minimized structured inputs.',
        'AI is not authorized to independently change questionnaire responses, scores, classifications, approved report structure, or other protected deterministic outputs.',
        'The platform does not use AI to diagnose disease, prescribe treatment, or replace professional clinical judgment.',
        'Its outputs are educational and must not be interpreted as confirmed medical findings or individualized predictions of disease.',
      ],
    },
    {
      heading: 'Data Retention and Deletion',
      paragraphs: [
        'We retain personal data for as long as reasonably necessary to fulfill the purposes described in this notice, subject to applicable legal obligations and approved retention requirements. Different categories of information may require different retention periods, including account records, assessment responses, generated reports, consent records, support communications, audit logs, and security records.',
        'Retention decisions consider service requirements, legal obligations, security needs, and applicable privacy rights.',
        'When information is no longer required, it is deleted, de-identified, or otherwise handled according to the applicable retention and disposal procedures.',
        'Deletion from active systems may not immediately remove protected backup copies maintained under defined backup-retention procedures.',
        'Requests for deletion may be subject to lawful exceptions, including records required for legal compliance or platform security.',
      ],
    },
    {
      heading: 'Information Security and Data Breaches',
      paragraphs: [
        'We recognize that assessment-related information requires appropriate technical and organizational protection. Our security framework addresses authorized access, authentication, encryption, protected report storage, logging, backup management, and security testing.',
        'Privileged access is subject to additional safeguards appropriate to the role and risk.',
        "Security measures are evaluated against the platform's deployed configuration, documented architecture, and applicable requirements.",
        'No online system can guarantee absolute security.',
        'If a personal-data breach occurs, ROOTS-AI™ will assess its legal obligations and make required notifications to relevant authorities and affected individuals in accordance with applicable law.',
        'Where Malaysian Data Protection Officer requirements apply, the responsible entity must satisfy the relevant appointment, notification, and related obligations.',
      ],
    },
    {
      heading: 'Your Privacy Rights and Choices',
      paragraphs: ['Depending on applicable law, you may have rights to:'],
      list: [
        'Request access to personal data held about you.',
        'Request correction of inaccurate or incomplete information.',
        'Withdraw consent where processing depends on consent.',
        'Request deletion or restriction where legally available.',
        'Request information about relevant processing activities.',
        'Request a copy or transfer of eligible personal data where applicable.',
        'Object to or limit certain processing where the law provides that right.',
        'Submit a complaint to an appropriate data-protection authority.',
      ],
      closing: [
        'These rights may differ by jurisdiction and may be subject to lawful conditions or exceptions.',
        'Withdrawal of consent does not invalidate processing lawfully completed before withdrawal.',
        'Where information is necessary to provide a requested service, withdrawal may affect our ability to continue that service.',
        'We may request reasonable identity verification before responding to privacy requests.',
      ],
    },
    {
      heading: 'Cookies and Analytics',
      paragraphs: [
        'The platform may use essential cookies or similar technologies for authentication, session management, security, and necessary technical functions. Optional public-site analytics are used only where permitted and, where required, after appropriate consent.',
        'Assessment, report, authentication, and administrative routes are not intended to use advertising pixels, session-replay technologies, or behavioral advertising.',
        "Any deployed analytics or tracking technology must remain consistent with this notice and the platform's actual configuration.",
      ],
    },
    {
      heading: 'Age Requirements',
      paragraphs: [
        'The ROOTS-AI™ Phase 1 assessment is intended for adults aged 18 or older. Users must confirm that they meet the applicable age requirement before beginning the assessment.',
        'Participation by individuals under 18 is not enabled unless a separately approved, legally appropriate process has been implemented, including any required parent or guardian authorization and additional safeguards.',
      ],
    },
    {
      heading: 'Contact and Privacy Requests',
      paragraphs: [
        'For questions about this Privacy Notice, personal-data processing, or requests to exercise privacy rights, please use our Contact page. Contact: https://www.roots-ai.health/contact',
        'Select Privacy & Data Requests as the enquiry type.',
        'Please provide sufficient information to explain your request without including unnecessary sensitive details.',
        'We may verify your identity and request additional information reasonably necessary to process your request.',
        'Where applicable, you may also contact the relevant data-protection authority about concerns regarding the handling of your personal data.',
      ],
    },
    {
      heading: 'Changes to This Notice',
      paragraphs: [
        'We may update this Privacy Notice to reflect changes in platform functionality, processing activities, organizational responsibilities, legal requirements, or applicable guidance. The current version and effective date will be displayed on this page.',
        'Where required by applicable law, material changes will be communicated through an appropriate notice or consent process before the relevant changes take effect.',
      ],
    },
  ],
  corporate: {
    heading: 'Corporate Information',
    paragraphs: ['ROOTS-AI™', 'Medicine Before Symptoms™'],
    subs: [
      { label: 'Primary Platform Operator', paragraphs: ['ROOTS AI HEALTH SYSTEMS, Inc.', 'Delaware, United States'] },
      { label: 'Malaysian Operational Affiliate', paragraphs: ['HOLLY7X Sdn. Bhd.', 'Malaysia'] },
    ],
    closing: ['Website: www.roots-ai.health', 'Privacy Requests: https://www.roots-ai.health/contact'],
  },
};

// ----------------------------------------------------------------- Medical Disclaimer

export const MEDICAL_DISCLAIMER: LegalDocument = {
  route: '/medical-disclaimer',
  title: 'Medical Disclaimer',
  kicker: 'ROOTS-AI™ / LEGAL',
  effective: {
    line: 'Version: 1.2 — Publication Candidate; Medical and Legal Sign-off Required. Effective Date: To be confirmed upon publication.',
  },
  blocks: [
    {
      heading: 'Educational Information. Not Medical Advice.',
      paragraphs: [
        'ROOTS-AI™ provides educational wellness information based primarily on self-reported questionnaire responses.',
        'The platform is not intended to diagnose, treat, cure, prevent, or predict disease, or to provide medical advice, clinical risk assessment, prognosis, or individualized treatment recommendations.',
        'Its assessments, scores, classifications, explanations, and reports are educational tools. They are not substitutes for medical history, physical examination, laboratory testing, professional evaluation, or clinical judgment.',
      ],
    },
    {
      heading: 'Understanding Your Results',
      paragraphs: [
        'ROOTS-AI™ indicators are generated using defined questionnaire-based rules and approved explanatory processes.',
        'These indicators are proprietary educational measures. They are not established diagnoses, validated probabilities of disease, or reliable predictions of future medical outcomes.',
        'A score or classification should not be interpreted as confirmation that a medical condition is present or absent.',
        'Normal-looking or favorable results do not rule out an underlying medical problem.',
      ],
    },
    {
      heading: 'Decisions About Your Health',
      paragraphs: [
        'Do not start, stop, or change medications, supplements, dietary restrictions, exercise programs, or medical treatment solely because of a ROOTS-AI™ assessment or report.',
        'Consult an appropriately qualified healthcare professional before making decisions that may affect your health, particularly if you have an existing medical condition, take medication, or experience persistent or changing symptoms.',
        'Use of ROOTS-AI™ does not establish a clinician-patient relationship.',
      ],
    },
    {
      heading: 'When to Seek Medical Care',
      paragraphs: [
        'Seek appropriate professional evaluation for symptoms that are persistent, severe, sudden, worsening, or otherwise concerning.',
        'If you believe you may be experiencing a medical emergency or are in immediate danger, contact local emergency services or seek urgent medical assistance.',
        'ROOTS-AI™ does not provide emergency monitoring or emergency response services.',
      ],
    },
  ],
  related: [
    { label: 'Terms of Use', href: '/terms' },
    { label: 'AI Disclaimer', href: '/ai-disclaimer' },
    { label: 'Privacy Notice', href: '/privacy' },
  ],
  corporate: CORPORATE_ROOTS,
};

// ----------------------------------------------------------------- Terms of Service

export const TERMS: LegalDocument = {
  route: '/terms',
  title: 'Terms of Service',
  kicker: 'ROOTS-AI™ / LEGAL',
  effective: {
    line: 'Version: 1.2 — Publication Candidate; Legal Sign-off Required. Effective Date: To be confirmed upon publication.',
  },
  intro: [
    'These Terms of Service govern your access to and use of the ROOTS-AI™ Phase 1 platform, owned and operated by ROOTS AI HEALTH SYSTEMS, Inc., a corporation incorporated in Delaware, United States.',
    'Please read these Terms alongside our Privacy Notice, Medical Disclaimer, and AI Disclaimer.',
  ],
  blocks: [
    {
      heading: 'Agreement and Eligibility',
      paragraphs: [
        'By accessing or using ROOTS-AI™, you agree to these Terms of Service. You must be at least 18 years old to use the Phase 1 assessment unless a separately approved and legally compliant process for minors has been introduced.',
        'You must not use the service if you are unable to enter into a legally binding agreement under applicable law.',
      ],
    },
    {
      heading: 'Nature of the Service',
      paragraphs: [
        'ROOTS-AI™ provides educational wellness information derived primarily from self-reported questionnaire responses. The platform uses defined rules to generate questionnaire-based indicators and approved processes to explain those results.',
        'ROOTS-AI™ is not intended to function as a medical diagnostic, treatment, clinical risk assessment, prognosis, or emergency response service.',
        'The service does not establish a clinician-patient relationship.',
      ],
    },
    {
      heading: 'Medical and Emergency Limitations',
      paragraphs: [
        'ROOTS-AI™ reports and explanations must not be used as substitutes for professional medical evaluation or advice. Do not use the service to diagnose or treat disease, make medication decisions, delay appropriate healthcare, or respond to a medical emergency.',
        'Consult a qualified healthcare professional regarding medical concerns or decisions that may affect your health.',
        'If you believe you may be experiencing a medical emergency, contact local emergency services or seek urgent medical assistance.',
      ],
    },
    {
      heading: 'Your Information and Account Security',
      paragraphs: [
        'You agree to provide information that you are authorized to submit and that reasonably reflects your experience. You are responsible for reviewing your submitted answers and protecting access to your email account and secure assessment links.',
        'Do not share authentication links with unauthorized individuals.',
        'If you suspect unauthorized access, contact ROOTS-AI™ through the designated support channel.',
        'Personal data is processed in accordance with the applicable Privacy Notice.',
      ],
    },
    {
      heading: 'Reports, Scores and AI-Assisted Content',
      paragraphs: [
        'ROOTS-AI™ scores, classifications, and related indicators are proprietary questionnaire-derived educational measures. They are not established medical diagnoses, clinically validated probabilities of disease, or reliable predictions of future medical outcomes.',
        'Reports may include AI-assisted explanatory wording that is governed by approved deterministic outputs and defined content restrictions.',
        'AI-assisted explanations are not authorized to independently change underlying scores, classifications, or protected report outputs.',
        'You may use your own report for personal educational purposes and may choose to discuss it with a qualified healthcare professional.',
        'Reports must not be represented as medical certification or used as the sole basis for clinical, employment, insurance, or other consequential decisions.',
      ],
    },
    {
      heading: 'Acceptable Use',
      paragraphs: ['You agree not to:'],
      list: [
        "Access or attempt to access another person's information without authorization.",
        'Interfere with the security, availability, or integrity of the platform.',
        'Introduce malware, exploit vulnerabilities, or bypass access controls.',
        'Scrape, systematically extract, or commercially reproduce protected platform content without authorization.',
        'Reverse engineer or attempt to obtain confidential scoring logic or protected technical systems except where applicable law expressly permits.',
        'Misrepresent ROOTS-AI™ reports as medical diagnoses or validated clinical assessments.',
        'Use the platform or its reports to make unauthorized employment, insurance, or other consequential decisions about individuals.',
      ],
      closing: ['We may take proportionate measures to investigate and address suspected misuse, subject to applicable law.'],
    },
    {
      heading: 'Intellectual Property',
      paragraphs: [
        'ROOTS-AI™ software, platform architecture, scoring methods, content, designs, trademarks, and other protected materials belong to ROOTS AI HEALTH SYSTEMS, Inc. or its respective licensors. Subject to these Terms, you receive a limited, non-exclusive, non-transferable permission to access the service and use your own report for personal, non-commercial educational purposes.',
        'No ownership rights in ROOTS-AI™ technology, methods, or proprietary content are transferred to you.',
        'Nothing in these Terms restricts rights that cannot lawfully be limited.',
      ],
    },
    {
      heading: 'Service Availability and Beta Features',
      paragraphs: [
        'ROOTS-AI™ may introduce, modify, correct, suspend, or discontinue features, subject to applicable legal obligations. Beta functionality may be incomplete, subject to testing, or affected by technical limitations.',
        'We may maintain historical report versions where necessary for accuracy, security, auditability, or applicable retention requirements.',
        'Features identified as planned, future, or Coming Soon are not part of the currently available service unless expressly activated.',
        'We do not guarantee that every proposed future feature will be released.',
      ],
    },
    {
      heading: 'Service Disclaimers',
      paragraphs: [
        'To the extent permitted by applicable law, ROOTS-AI™ is provided without a guarantee of uninterrupted availability, error-free operation, fitness for a clinical purpose, or any particular health, wellness, or weight-related outcome. Educational results depend in part on the information submitted and the defined rules applied.',
        'Nothing in these Terms excludes warranties, remedies, or statutory protections that cannot lawfully be excluded.',
      ],
    },
    {
      heading: 'Limitation of Liability',
      paragraphs: [
        'To the extent permitted by applicable law, ROOTS AI HEALTH SYSTEMS, Inc. is not responsible for losses arising from reliance on educational outputs as medical advice, unauthorized use of reports, or account access outside its reasonable control. Liability for indirect or consequential losses may be limited only to the extent permitted by applicable law.',
        'Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited, including applicable mandatory consumer protections.',
      ],
    },
    {
      heading: 'Suspension and Termination',
      paragraphs: [
        'You may stop using ROOTS-AI™ at any time. We may suspend or restrict access where reasonably necessary to address security risks, unlawful activity, material breaches of these Terms, or threats to other users or the platform.',
        'Where appropriate and legally required, we will provide notice or an opportunity to address the issue.',
        'Following termination or suspension, personal data will be handled according to the Privacy Notice and applicable retention requirements.',
      ],
    },
    {
      heading: 'Governing Law and Jurisdiction',
      paragraphs: [
        'The governing law and dispute-resolution arrangements for the service must be specified in the jurisdiction-specific legally approved Terms before publication. No governing-law selection or exclusive forum is established by this publication-candidate text. Nothing in these Terms removes mandatory consumer or data-protection rights that apply to you under applicable law.',
      ],
    },
    {
      heading: 'Contact and Changes to These Terms',
      paragraphs: [
        'Questions about these Terms may be submitted through our Contact page. We may update these Terms to reflect changes in the service, legal requirements, or operational arrangements.',
        'The current version and effective date will be displayed on this page.',
        'Where required, material changes will be communicated through an appropriate notice or acceptance process.',
        'Continued use after changes take effect may constitute acceptance only where permitted by applicable law.',
      ],
    },
  ],
  related: [
    { label: 'Privacy Notice', href: '/privacy' },
    { label: 'Medical Disclaimer', href: '/medical-disclaimer' },
    { label: 'AI Disclaimer', href: '/ai-disclaimer' },
  ],
  corporate: CORPORATE_ROOTS,
};

// ----------------------------------------------------------------- AI Disclaimer

export const AI_DISCLAIMER: LegalDocument = {
  route: '/ai-disclaimer',
  title: 'AI Disclaimer — Publication Candidate, Pending Legal and Technical Approval',
  kicker: 'ROOTS-AI™ / LEGAL',
  effective: { line: 'Effective Date: To be confirmed upon publication.' },
  blocks: [
    {
      heading: 'Purpose and Scope',
      paragraphs: [
        'ROOTS-AI™ uses predefined questionnaire-based analytical rules to produce educational scores, classifications, and eligible report content. Governed AI may assist only with approved explanatory language within authorized content and data boundaries.',
      ],
    },
    {
      heading: 'What AI Does Not Determine',
      paragraphs: [
        'AI is not authorized to independently calculate, modify, or override questionnaire responses, domain scores, classifications, rule-selected drivers, confidence-related indicators, unavailable states, or the approved report structure. It is not authorized to invent personal facts or generate unsupported clinical conclusions.',
      ],
    },
    {
      heading: 'Limits of AI Explanations',
      paragraphs: [
        'AI-generated or AI-assisted wording does not constitute independent medical evidence, clinical validation, diagnosis, prognosis, or personalized treatment advice. Fluent language must not be mistaken for certainty. Where inputs are missing or insufficient, the approved result must preserve that limitation.',
      ],
    },
    {
      heading: 'Data Minimization and Providers',
      paragraphs: [
        'Any AI-language processing must use only permitted, minimized inputs and approved providers, configurations, contractual safeguards, and access controls. Identifiable health-related information must not be transferred to an AI provider unless the actual deployment and applicable legal requirements explicitly authorize that transfer.',
      ],
    },
    {
      heading: 'Human and Clinical Responsibility',
      paragraphs: [
        'ROOTS-AI™ does not replace a qualified healthcare professional. Do not use AI-assisted explanations to diagnose disease, decide on medications, delay medical care, or respond to emergencies.',
      ],
    },
  ],
  related: [
    { label: 'Privacy Notice', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Medical Disclaimer', href: '/medical-disclaimer' },
  ],
};

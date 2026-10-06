# ROOTS-AI™ Biological Intelligence Platform

A governed biological intelligence assessment and reporting platform that turns structured assessments into comprehensive biological intelligence reports.

## Project Overview

ROOTS-AI™ helps users understand patterns in metabolism, hunger, sleep, circadian timing, stress, inflammation-related signals, and perceived biological resistance through a structured 73-question assessment across 13 biological domains.

### Key Features

- **73 Canonical Questions**: Structured assessment across 13 biological modules
- **Deterministic Scoring**: AI assists with explanation, not calculation
- **Secure Session Management**: HTTPOnly cookies with 60-minute server/session expiry
- **Autosave Functionality**: Automatic progress saving with status indicators
- **Resume Capability**: Secure session restoration after leaving
- **Access Isolation**: Cross-user data protection and session validation
- **WCAG 2.1 AA Compliant**: Accessible design with keyboard navigation support

### Biological Domains

1. **MR** - Metabolic Resistance™
2. **HS** - Hunger & Satiety Signals™
3. **SR** - Sleep Recovery Index™
4. **CH** - Circadian Health Score™
5. **SL** - Stress Load™
6. **IB** - Inflammation Burden Index™
7. **BS** - Biological Safety Signals™

## Tech Stack

- **Framework**: Next.js 16.3.4 with React 19.2.8
- **Styling**: Tailwind CSS 4
- **Build Tool**: Turbopack
- **Language**: TypeScript
- **Deployment**: Vercel
- **Database**: In-memory Map storage (Supabase integration planned)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/souhail555/roots-ai-learning.git
cd roots-ai-learning

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Development

```bash
# Run the development server
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production Build

```bash
# Build for production
npm run build
# or
yarn build
# or
pnpm build
# or
bun build

# Start production server
npm start
# or
yarn start
# or
pnpm start
# or
bun start
```

## Project Structure

```
roots-ai-learning/
├── app/                    # Next.js app directory
│   ├── assessment/         # Assessment routes and pages
│   ├── api/               # API routes for sessions and answers
│   ├── layout.tsx         # Root layout with header/footer
│   ├── page.tsx           # Homepage with biological visualization
│   └── globals.css        # Global styles and CSS variables
├── components/            # React components
│   └── layout/           # Header, Footer, and other layout components
├── lib/                  # Core business logic
│   ├── canonicalAssessment.ts  # 73 canonical questions across 13 modules
│   ├── db.ts             # Session management and data storage
│   ├── scoring.ts        # Deterministic scoring logic
│   └── utils.ts          # Utility functions
├── docs/                 # Documentation
│   └── m1/              # M1 compliance documentation
├── public/              # Static assets (logos, images)
└── package.json         # Dependencies and scripts
```

## API Routes

### Session Management
- `POST /api/assessment/sessions` - Create new assessment session
- `GET /api/assessment/sessions/[sessionId]` - Get session details
- `POST /api/assessment/sessions/[sessionId]/answers` - Save assessment answers

### Assessment Routes
- `/assessment` - Assessment start page
- `/assessment/[sessionId]/module/[moduleId]` - Assessment question pages
- `/assessment/[sessionId]/resume` - Resume saved assessment

## M1, M2 and M3 project view

Open [`/project-status`](/project-status) in the running application to view the consolidated M1, M2 and M3 implementation status, evidence links and open production gates.

The source packages remain available in:

- `docs/m1/` — foundation, assessment shell and traceability evidence
- `docs/m2/` — canonical assessment, deterministic scoring and Golden Tests
- `docs/m3/` — governed report/PDF/AI boundary, decisions and open gates

The project-status page is an implementation evidence view, not a formal medical, legal or regulatory acceptance certificate.

## M1 Compliance

This project implements all M1 requirements according to the Vendor Package v1.4:

- ✅ **G0–G2 Closure**: Technical foundation established
- ✅ **ROOTS-Owned Repository**: Code in controlled GitHub repository
- ✅ **Architecture**: Next.js with proper API structure
- ✅ **Authentication**: HTTPOnly session cookies with 60-minute server/session expiry
- ✅ **Canonical Assessment Shell**: 73 questions across 13 modules
- ✅ **Autosave**: Debounced autosave with status indicators
- ✅ **Resume**: Secure session restoration
- ✅ **Access Isolation**: Session-based data protection
- ✅ **M1 Traceability**: Complete requirement → implementation mapping

See `docs/m1/M1_FINAL_UNIFIED_PACKAGE.md` for comprehensive M1 documentation.

## Security Features

- **Session Security**: HTTPOnly, sameSite cookies
- **XSS Protection**: Input sanitization and React's built-in protections
- **CSRF Protection**: Session-based validation
- **Data Isolation**: Session-based data separation
- **Access Control**: API route validation

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- ARIA labels and roles
- Skip navigation links

## Deployment

### Vercel Deployment

The project is deployed on Vercel: https://roots-ai-learning.vercel.app/

```bash
# Deploy to Vercel
vercel deploy
```

### Environment Variables

The assessment and deterministic report engine run without environment variables in the current self-hosted implementation.

Optional production integrations:

- `CONTACT_WEBHOOK_URL` — HTTPS endpoint for validated contact enquiries. If it is not configured, the Contact page shows a clear delivery error and does not claim that a message was received.
- `OPENAI_API_KEY` and `AI_NARRATIVE_MODEL` — optional governed narrative transport. Without them, the deterministic governed fallback is used.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` — reserved for the approved production persistence/authentication integration.

No credentials are stored in this repository.

## Contributing

This is a controlled package following ROOTS-AI development standards. All changes must align with the Vendor Package v1.4 specifications.

## License

© 2026 ROOTS AI HEALTH SYSTEMS, Inc. All rights reserved.

## Support

For issues or questions, refer to the M1 documentation in `docs/m1/` or contact the development team.

---

**Version**: 1.0.0  
**M1 Status**: Functionally Complete  
**Production URL**: https://roots-ai-learning.vercel.app/

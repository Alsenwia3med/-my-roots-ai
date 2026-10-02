# ROOTS-AI Health Assessment Platform

A comprehensive health assessment platform built with Next.js, TypeScript, and Supabase.

## Features

- **73 Questions** across 13 modules covering various health aspects
- **7-Domain Scoring System**: Metabolic Resistance, Hunger & Satiety Signals, Sleep Recovery Index, Circadian Health Score, Stress Load, Inflammation & Burden, Biological Safety Signals
- **Deterministic Scoring Engine** based on C-02 v1.0.1 canonical rules
- **Validation System** based on C-01 v1.0.1 canonical rules
- **Progress Tracking** with module navigation
- **Report Generation** with domain scores, drivers, and recommendations
- **Secure Database** with Row Level Security (RLS) policies
- **Responsive Design** with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (to be integrated)
- **Forms**: React Hook Form, Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase project (create one at https://supabase.com)
- Python 3 with openpyxl for data generation

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Alsenwia3med/-my-roots-ai.git
cd -my-roots-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Generate canonical data from Excel workbooks:
```bash
python scripts/canonical/generate.py
python scripts/canonical/generate_scoring.py
```

5. Set up the database:
   - Open your Supabase project
   - Go to SQL Editor
   - Run the schema from `supabase/schema.sql`

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
my-roots-ai/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Home page
│   │   ├── assessment/        # Assessment pages
│   │   ├── report/            # Report pages
│   │   └── auth/              # Authentication pages
│   ├── lib/
│   │   ├── assessment/        # Assessment logic
│   │   │   ├── c01-question-bank.json
│   │   │   ├── validation.ts
│   │   │   └── progress.ts
│   │   ├── scoring/           # Scoring engine
│   │   │   ├── c02-ruleset.json
│   │   │   └── engine.ts
│   │   └── db/                # Database utilities
│   │       └── supabase.ts
│   └── components/            # Reusable components
├── scripts/
│   └── canonical/             # Data generation scripts
├── supabase/
│   └── schema.sql            # Database schema
└── public/                   # Static assets
```

## Canonical Data

The platform uses canonical data generated from controlled workbooks:

- **C-01 Question Bank**: 73 questions, 27 option sets, 11 validation rules
- **C-02 Scoring Rules**: 7 domains, 40 question mappings, 30 golden tests

To regenerate the data:
```bash
python scripts/canonical/generate.py
python scripts/canonical/generate_scoring.py
```

## Scoring System

The scoring engine calculates scores across 7 domains:

1. **MR** - Metabolic Resistance
2. **HS** - Hunger & Satiety Signals
3. **SR** - Sleep Recovery Index
4. **CH** - Circadian Health Score
5. **SL** - Stress Load
6. **IB** - Inflammation & Burden
7. **BS** - Biological Safety Signals

Each domain score is calculated as:
```
ROUND(SUM(answer_points) / SUM(max_points) * 100)
```

Additional metrics:
- **Biological State**: Average of domains (requires ≥5 of 7 domains)
- **Opportunity**: 100 - Biological State
- **Recovery Potential**: Based on opportunity, protective factors, and age
- **Confidence**: Weighted average of answer confidence and coverage
- **Drivers**: Top scoring domains (≥25) with tie-breaking rules

## Security

The application implements comprehensive security measures:

- **Row Level Security (RLS)** policies on all database tables
- **Server-side validation** for all submissions
- **Integrity constraints** to prevent data tampering
- **Audit logging** for all critical operations
- **No AI authority** over scoring (deterministic engine only)

## Building for Production

```bash
npm run build
npm start
```

## Deployment

The application can be deployed to Vercel, Netlify, or any platform that supports Next.js.

### Vercel Deployment

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables
4. Deploy

## Testing

Run the test suite:
```bash
npm test
```

## License

This project is for personal use.

## Disclaimer

This assessment is for informational purposes only and does not constitute medical advice. Please consult with a qualified healthcare professional for any health concerns.

## Credits

Built by Ahmed Alsenwi

Generated with [Devin](https://devin.ai)

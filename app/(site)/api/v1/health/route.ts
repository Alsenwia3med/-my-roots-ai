// GET /api/v1/health — liveness and release metadata (C-06 §2 System). No data access.

import { json } from '@/lib/api/http';
import { QUESTIONNAIRE_VERSION } from '@/lib/assessment/questionBank';
import { appEnv } from '@/lib/env';
import { SCORING_VERSION } from '@/lib/scoring/c02-ruleset';
import { C01_SOURCE, C02_SOURCE } from '@/lib/versions';

export const dynamic = 'force-dynamic';

export async function GET() {
  return json({
    status: 'ok',
    environment: appEnv(),
    api_version: 'v1',
    questionnaire_version: QUESTIONNAIRE_VERSION,
    scoring_version: SCORING_VERSION,
    // M2 item 7: the controlled sources this deployment runs on.
    sources: {
      c01: { label: C01_SOURCE.label, sha256: C01_SOURCE.sha256 },
      c02: { label: C02_SOURCE.label, sha256: C02_SOURCE.sha256 },
    },
    time: new Date().toISOString(),
  });
}

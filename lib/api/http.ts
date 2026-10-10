// JSON responses and request helpers for the versioned API (/api/v1). Error bodies never echo
// submitted answers, tokens or identifiers.

import 'server-only';
import { NextResponse } from 'next/server';
import { getParticipant } from '@/lib/supabase/server';

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export function json<T>(body: T, status = 200): NextResponse<T> {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return json<ApiErrorBody>({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status);
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The verified participant, or a 401 response to return. */
export async function requireParticipant() {
  const { supabase, user } = await getParticipant();
  if (!user) return { unauthorized: apiError(401, 'SESSION_EXPIRED', 'Sign in to continue.') } as const;
  return { supabase, user } as const;
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Page guards for authorized assessment screens (C-05 ASM-04..ASM-10 "Authorized participant").

import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { getParticipant } from '@/lib/supabase/server';
import { getOwnedAssessment, hasServiceConsent } from './store';

/** Signed-in participant or redirect to ASM-01 with the C-04 SESSION-EXPIRED message. */
export async function requirePageParticipant() {
  const { supabase, user } = await getParticipant();
  if (!user) redirect('/assessment?session=expired');
  return { supabase, user };
}

/** Signed-in participant with a current service consent. */
export async function requireConsentedParticipant() {
  const ctx = await requirePageParticipant();
  if (!(await hasServiceConsent(ctx.supabase, ctx.user.id))) redirect('/assessment/consent');
  return ctx;
}

/** An assessment the participant owns; anything else is a 404 (existence is not revealed). */
export async function requireOwnedAssessment(sessionId: string) {
  const ctx = await requireConsentedParticipant();
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) notFound();
  const assessment = await getOwnedAssessment(ctx.supabase, sessionId);
  if (!assessment) notFound();
  return { ...ctx, assessment };
}

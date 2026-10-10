/**
 * Server-side environment configuration. Names and purposes are listed in .env.example and
 * docs/m1/ENVIRONMENT_REGISTER.md; secret values never appear in source or documentation.
 */

export type AppEnv = 'development' | 'staging' | 'production';

/**
 * APP_ENV must be set explicitly per environment. When it is missing the application treats
 * itself as production, so safety switches (demo sign-in) stay off by default.
 */
export function appEnv(): AppEnv {
  const value = process.env.APP_ENV;
  return value === 'development' || value === 'staging' || value === 'production' ? value : 'production';
}

/**
 * Demo sign-in returns the secure link in the API response instead of relying on email.
 * It is honoured only outside production: with APP_ENV=production (or APP_ENV unset) the flag
 * is ignored, whatever MAGIC_LINK_DEMO_MODE says.
 */
export function demoSignInEnabled(): boolean {
  return process.env.MAGIC_LINK_DEMO_MODE === 'true' && appEnv() !== 'production';
}

/** Must match Supabase Auth > Email > "Email OTP Expiration" for the project. */
export function magicLinkExpiryMinutes(): number {
  return positiveInt(process.env.MAGIC_LINK_EXPIRY_MINUTES, 15);
}

/** Secure-link requests allowed per email address in a 15-minute window. */
export function magicLinkMaxRequests(): number {
  return positiveInt(process.env.MAGIC_LINK_MAX_REQUESTS, 3);
}

/** Inactivity limit for the assessment session (C-05 ASM-06 zone 7). */
export function assessmentIdleTimeoutMinutes(): number {
  return positiveInt(process.env.ASSESSMENT_IDLE_TIMEOUT_MINUTES, 30);
}

/**
 * Base URL for links sent by email. Required outside development so a spoofed Host header can
 * never redirect a secure link to another domain.
 */
export function appUrl(requestOrigin: string): string {
  const configured = process.env.APP_URL?.replace(/\/+$/, '');
  if (configured) return configured;
  if (appEnv() === 'development') return requestOrigin;
  throw new Error('APP_URL is not configured for this environment.');
}

export function supabasePublicConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

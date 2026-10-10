// ADM-01 · Admin Sign-in and MFA (/admin). Approved provider authentication (Google, through
// Supabase Auth), a required TOTP challenge, controlled recovery, and the Staging/Production
// badge after authentication. No public signup: signing in grants nothing by itself — access
// needs an active staff role, granted by a Super Admin. No participant or report data here.

import { redirect } from 'next/navigation';
import styles from './admin.module.css';
import AdminSignOut from './_components/AdminSignOut';
import MfaStep from './_components/MfaStep';
import { safeNextPath } from '@/lib/admin/format';
import { getStaffState } from '@/lib/admin/guard';
import { landingPath } from '@/lib/admin/roles';
import { SYSTEM } from '@/lib/assessment/copy';
import { appEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

function EnvironmentBadge() {
  const env = appEnv();
  return (
    <div className={styles.envRow}>
      <span className={`${styles.small} ${styles.muted}`}>Environment</span>
      <span className={`${styles.pill} ${env === 'production' ? styles.pillProduction : ''}`}>{env.toUpperCase()}</span>
    </div>
  );
}

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; session?: string; state?: string; reauth?: string; next?: string }>;
}) {
  const params = await searchParams;
  const state = await getStaffState();

  if (state.kind === 'ready') {
    // Re-verification for privileged writes (ADM-07/ADM-10): a fresh TOTP challenge even though
    // the session is already AAL2, then back to the screen that asked for it.
    if (params.reauth === '1') {
      const { data: factors } = await state.ctx.supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.find((f) => f.status === 'verified');
      if (factor) {
        return (
          <main id="main" className={styles.wrap}>
            <div className={`${styles.card} ${styles.signIn}`}>
              <h1 className={styles.title}>Confirm it&apos;s you</h1>
              <p className={styles.subtitle}>This action requires a recent authenticator verification.</p>
              <MfaStep mode="challenge" factorId={factor.id} next={safeNextPath(params.next, landingPath(state.ctx.roles))} />
            </div>
          </main>
        );
      }
    }
    redirect(landingPath(state.ctx.roles));
  }

  return (
    <main id="main" className={styles.wrap}>
      <div className={`${styles.card} ${styles.signIn}`}>
        <h1 className={styles.title}>Administrator access</h1>
        <p className={styles.subtitle}>Privileged users only</p>

        {state.kind === 'signed_out' && (
          <>
            <h2 className={styles.stepTitle}>Approved provider authentication</h2>
            {params.session === 'expired' && (
              <p className={styles.error} role="alert">
                {SYSTEM.sessionExpired}
              </p>
            )}
            {params.error === 'provider' && (
              <p className={styles.error} role="alert">
                Sign-in could not be completed. Please try again.
              </p>
            )}
            <div className={styles.actions}>
              <a className={`${styles.btn} ${styles.btnBlock}`} href="/api/v1/auth/google?next=/admin">
                Continue with Google
              </a>
            </div>
            <p className={`${styles.muted} ${styles.small}`} style={{ marginTop: 'var(--zd-space-3)' }}>
              Use the Google account your administrator access was granted to.
            </p>
          </>
        )}

        {state.kind === 'no_role' && (
          <>
            <h2 className={styles.stepTitle}>Access not available</h2>
            <p role="alert">This account does not have administrator access.</p>
            <p className={`${styles.muted} ${styles.small}`} style={{ marginTop: 'var(--zd-space-2)' }}>
              Access is granted by a Super Admin to a named account. If you expected access, contact your Super Admin.
            </p>
            <div className={styles.actions}>
              <AdminSignOut className={`${styles.btn} ${styles.btnSecondary}`} />
            </div>
          </>
        )}

        {state.kind === 'enroll' && <MfaStep mode="enroll" next={landingPath(state.ctx.roles)} />}

        {state.kind === 'challenge' && (
          <MfaStep mode="challenge" factorId={state.factorId} next={landingPath(state.ctx.roles)} />
        )}

        {(state.kind === 'enroll' || state.kind === 'challenge') && (
          <>
            <h2 className={styles.stepTitle}>Controlled recovery</h2>
            <p className={`${styles.muted} ${styles.small}`}>
              Lost your authenticator? A Super Admin can reset it after confirming your identity. There is no
              security-question fallback.
            </p>
            <EnvironmentBadge />
            <div className={styles.actions}>
              <AdminSignOut />
            </div>
          </>
        )}
      </div>
      <p className={`${styles.muted} ${styles.small}`} style={{ marginTop: 'var(--zd-space-4)', textAlign: 'center' }}>
        Role-based access is checked before any administrative data is shown.
      </p>
    </main>
  );
}

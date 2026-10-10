'use client';

/**
 * Removes the pending address as soon as the participant has a session.
 *
 * ROOTS decision of 30 September 2026, section 7: the address must not be retained beyond the
 * entry/authentication flow. A verified session means that flow has completed, so the assessment
 * shell renders this on every signed-in screen and the address goes at the first one reached.
 *
 * Renders nothing.
 */

import { useEffect } from 'react';
import { clearPendingEmail } from './pendingEmail';

export default function ClearPendingEmail() {
  useEffect(() => clearPendingEmail(), []);
  return null;
}

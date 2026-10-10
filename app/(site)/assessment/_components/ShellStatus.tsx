'use client';

// Renders participant controls (progress, Save & Exit, sign-out) into the assessment shell
// header slot defined in app/assessment/layout.tsx.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ShellStatus({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setTarget(document.getElementById('assessment-shell-status')), []);
  return target ? createPortal(children, target) : null;
}

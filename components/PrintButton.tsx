'use client';

import { Printer } from 'lucide-react';

/** Print control for the legal notices. Client-side so the pages themselves stay server-rendered. */
export default function PrintButton() {
  return (
    <button className="print-button" onClick={() => window.print()} type="button">
      <Printer size={16} strokeWidth={1.8} aria-hidden="true" />
      Print
    </button>
  );
}

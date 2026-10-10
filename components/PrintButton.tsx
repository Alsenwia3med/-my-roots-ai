'use client';

/** Print control for the legal notices. Client-side so the pages themselves stay server-rendered. */
export default function PrintButton() {
  return (
    <button className="print-button" onClick={() => window.print()} type="button">
      ▣ Print
    </button>
  );
}

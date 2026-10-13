"use client";

import { useState } from "react";

/**
 * The closing principle of the seven stages. Press it and a thread of green runs along its
 * edges until it is pressed again.
 */
export default function RoadmapClose() {
  const [lit, setLit] = useState(false);
  const toggle = () => setLit((v) => !v);
  return (
    <div
      className="lxrm-close"
      data-reveal=""
      data-lit={lit ? "" : undefined}
      role="button"
      tabIndex={0}
      aria-pressed={lit}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <h3 className="lxrm-close-title">One Principle Across Every Stage: Governance Is Built Into the Foundation.</h3>
      <p className="lxrm-close-text">
        <span>Assessment Is the Entry Point.</span> <span>Human Systems Intelligence Is the Destination.</span>
      </p>
    </div>
  );
}

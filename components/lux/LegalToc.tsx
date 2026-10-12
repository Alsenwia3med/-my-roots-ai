"use client";

import { useEffect, useState } from "react";

/**
 * The legal contents list, with the section currently being read highlighted. Below 1024px it
 * stays a disclosure, so a fourteen-section notice is still navigable on a phone.
 */
export default function LegalToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  const index = Math.max(0, items.findIndex((i) => i.id === active));

  return (
    <details className="lxl-toc" open>
      <summary>Contents</summary>
      <div className="lxl-toc-track" aria-hidden="true">
        <span style={{ transform: `scaleY(${items.length ? (index + 1) / items.length : 0})` }} />
      </div>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} data-active={item.id === active ? "true" : undefined} aria-current={item.id === active ? "location" : undefined}>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

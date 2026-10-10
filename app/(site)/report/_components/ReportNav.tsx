'use client';

/**
 * RPT-03 Report Section Navigation. Desktop: sticky contents with the 19 numbered sections.
 * Mobile: a current-section control that opens a full-height drawer. The active section follows
 * scrolling (IntersectionObserver) and is kept in the URL hash; "Return to top" appears after
 * section 3. Navigation never changes what the report says.
 */

import { useEffect, useRef, useState } from 'react';
import styles from '../report.module.css';

export default function ReportNav({ sections }: { sections: { number: number; title: string }[] }) {
  const [active, setActive] = useState(1);
  const drawer = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(`section-${s.number}`)).filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (!visible.length) return;
        const n = Number(visible[0].target.id.replace('section-', ''));
        setActive(n);
        history.replaceState(null, '', `#section-${n}`);
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const list = (onPick?: () => void) => (
    <ol className={styles.tocList}>
      {sections.map((s) => (
        <li key={s.number}>
          <a className={styles.tocLink} href={`#section-${s.number}`} aria-current={active === s.number ? 'location' : undefined} onClick={onPick}>
            {pad(s.number)} {s.title}
          </a>
        </li>
      ))}
    </ol>
  );
  const current = sections.find((s) => s.number === active);

  return (
    <>
      <nav className={styles.toc} aria-label="Report contents">
        <div className={styles.tocTitle}>Report contents</div>
        {list()}
      </nav>

      <div className={styles.mobileNav}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSecondary}`}
          style={{ width: '100%', justifyContent: 'space-between' }}
          aria-haspopup="dialog"
          onClick={() => drawer.current?.showModal()}
        >
          <span>
            {pad(active)} {current?.title}
          </span>
          <span aria-hidden="true">▾</span>
        </button>
      </div>
      <dialog ref={drawer} className={styles.drawer} aria-label="Report contents">
        <div className={styles.tocTitle}>Report contents</div>
        {list(() => drawer.current?.close())}
        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} style={{ marginTop: 'var(--zd-space-4)', width: '100%' }} onClick={() => drawer.current?.close()}>
          Close
        </button>
      </dialog>

      {active > 3 && (
        <a href="#section-1" className={`${styles.btn} ${styles.btnSecondary} ${styles.returnTop}`}>
          ↑ Return to top
        </a>
      )}
    </>
  );
}

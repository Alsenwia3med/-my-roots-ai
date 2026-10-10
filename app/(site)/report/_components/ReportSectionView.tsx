/*
 * The renderer for one of the 19 report sections (RPT-02).
 *
 * It lives in its own module so the same component that the participant sees can be rendered
 * outside Next.js by `npm run evidence:parity`, which compares it field by field with the PDF.
 * Review point 30 requires that comparison to be programmatic, and it is only meaningful if
 * the verifier exercises the real component rather than a copy of it.
 *
 * Presentation only: every value comes from the stored canonical object, and nothing here
 * derives, reorders or recalculates anything.
 */

import styles from '../report.module.css';
import type { ReportSection } from '@/lib/report/build';
import { TRIAD_DIAGRAM_LABEL, TRIAD_KIND_LABELS, WHY_HEADING } from '@/lib/report/c03-content';

/**
 * The canonical JSON stores timestamps as ISO data (it is immutable once generated); they are
 * formatted only for display, so existing reports read correctly too.
 */
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';

export const displayValue = (value: string) => (ISO_TIMESTAMP.test(value) ? formatDate(value) : value);

export default function Section({ section }: { section: ReportSection }) {
  return (
    <section id={`section-${section.number}`} className={styles.section} aria-labelledby={`section-${section.number}-title`}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionNumber}>{String(section.number).padStart(2, '0')}</span>
        <h2 id={`section-${section.number}-title`} className={styles.sectionTitle}>
          {section.title}
        </h2>
      </div>

      {/* Review point 4: the score-direction statement, before the values it applies to. */}
      {section.lede && <p className={styles.lede}>{section.lede}</p>}

      {/* Section 7 renders its lines as labelled bars instead of plain paragraphs. */}
      {!section.bars && section.paragraphs.map((p, i) => <p key={i} className={styles.para}>{p}</p>)}

      {section.bars && (
        <div className={styles.bars}>
          {section.bars.map((b) => (
            <div key={b.domain_id}>
              <div className={styles.barHead}>
                <span className={styles.itemLabel}>{b.label}</span>
                <span>{b.score === null ? 'Not enough information' : `${b.score}/100 — ${b.classification}`}</span>
              </div>
              {/*
                * The bar is decorative for assistive technology: the domain, the number and the
                * classification are already in the visible text directly above it, which is what
                * C-05 §13 requires of a chart ("label, numeric value, classification and text
                * explanation"). It previously carried role="img" with an aria-label repeating
                * that text, which announced every domain twice — the duplicate announcement the
                * ROOTS decision of 29 September asks us to avoid.
                */}
              <div className={styles.barTrack} aria-hidden="true">
                {b.score !== null && <div className={styles.barFill} style={{ width: `${b.score}%`, background: b.color_hex ?? 'var(--zd-navy)' }} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/*
        * A list, not a row of coloured circles: C-05 §13 requires that colour never be the sole
        * carrier of meaning, so each element states its kind in text. The ring colour still
        * distinguishes a driver from a protective factor, but it now repeats the caption.
        */}
      {section.triad && (
        <ul className={styles.triad} aria-label={TRIAD_DIAGRAM_LABEL}>
          {section.triad.map((t, i) => (
            <li key={i} className={styles.triadItem}>
              <div
                className={`${styles.triadCircle} ${t.kind === 'protective' ? styles.triadProtective : ''} ${t.kind === 'unavailable' ? styles.triadUnavailable : ''}`}
              >
                {t.label}
              </div>
              <span className={styles.triadKind}>{TRIAD_KIND_LABELS[t.kind]}</span>
            </li>
          ))}
        </ul>
      )}

      {section.items && section.items.length > 0 && (
        <ul className={styles.items}>
          {section.items.map((item, i) => (
            <li key={i} className={styles.item}>
              <div className={styles.itemLabel}>{item.label}</div>
              {item.value && <div className={styles.itemValue}>{displayValue(item.value)}</div>}
              {item.note && <div className={styles.itemNote}>{item.note}</div>}
            </li>
          ))}
        </ul>
      )}

      {/* Review point 3: how the composite relates to the component values shown above. */}
      {section.footnote && <p className={styles.footnote}>{section.footnote}</p>}

      {/* Review point 23: explainability, association only. */}
      {section.why && (
        <div className={styles.why}>
          <h3 className={styles.whyHeading}>{WHY_HEADING}</h3>
          <p className={styles.whyText}>{section.why}</p>
        </div>
      )}

      {section.modules?.map((m, i) => (
        <details key={i} className={styles.module}>
          <summary>{m.title}</summary>
          <ol className={styles.answers}>
            {m.answers.map((a) => (
              <li key={a.question_id}>
                <div className={styles.question}>
                  Q{a.number}. {a.text}
                </div>
                <div className={styles.answerMeta}>
                  <span className={styles.answerTag} data-kind={a.kind}>
                    {a.kind === 'scoring' ? 'Scoring input' : 'Context only'}
                  </span>
                  {a.freeText && <span className={styles.answerTag} data-kind="free-text">Participant response</span>}
                </div>
                {/* Shown exactly as submitted, including spelling and grammar (review point 20). */}
                <div className={a.freeText ? `${styles.answer} ${styles.answerVerbatim}` : styles.answer}>{a.answer}</div>
              </li>
            ))}
          </ol>
        </details>
      ))}
    </section>
  );
}

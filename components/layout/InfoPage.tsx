import Link from "next/link";

export interface InfoSection {
  title: string;
  text: string;
}

/**
 * A group of sections rendered under one shared sub-heading, e.g. "Available now"
 * or "Mission and method" on the public inner pages.
 */
export interface InfoGroup {
  title: string;
  items: readonly InfoSection[];
}

export interface InfoPageProps {
  eyebrow: string;
  /** Omit the visible <h1> when the page title is carried by the document <title> only. */
  title?: string;
  intro: string;
  sections?: readonly InfoSection[];
  groups?: readonly InfoGroup[];
  /** Hide the trailing "Start Your Assessment" call to action. */
  showActions?: boolean;
}

export default function InfoPage({ eyebrow, title, intro, sections = [], groups = [], showActions = true }: InfoPageProps) {
  return (
    <main className="marketing-page inner-page">
      <section className="page-heading">
        <p className="marketing-kicker">{eyebrow}</p>
        {title && <h1>{title}</h1>}
        <p>{intro}</p>
      </section>
      {groups.map((group) => (
        <section className="info-group" key={group.title}>
          <div className="pub-shell">
            <h2 className="info-group-heading">{group.title}</h2>
            <ul className="info-bullet-list">
              {group.items.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
      {sections.length > 0 && (
        <section className="info-section-grid">
          {sections.map((section) => (
            <article key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </article>
          ))}
        </section>
      )}
      {showActions && (
        <div className="center-actions"><Link href="/assessment" className="primary-button">Start Your Assessment</Link></div>
      )}
    </main>
  );
}

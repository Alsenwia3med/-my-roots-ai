import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { FooterData } from "./chrome-data";

/** Site footer. The copy is passed in, so the homepage and inner pages each keep their own wording. */
export default function LuxFooter({ data }: { data: FooterData }) {
  const [first, ...rest] = data.notes;
  return (
    <footer className="lxf">
      <div className="lx-wrap">
        <div className="lxf-grid">
          <div className="lxf-brand" data-reveal="">
            <Link href="/" className="lxf-logo" aria-label="ROOTS-AI home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/roots-logo.svg" alt="ROOTS-AI Biological Intelligence" width={603} height={792} />
            </Link>
          </div>
          <div className="lxf-cols">
            {data.columns.map((col, ci) => (
              <div className="lxf-col" key={col.title} data-reveal="" style={{ "--d": `${(ci + 1) * 90}ms` } as CSSProperties}>
                <h3>{col.title}</h3>
                <ul>
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link className="lxf-link" href={href}>
                        <span>{label}</span>
                        <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="lxf-bottom" data-reveal="" style={{ "--d": "420ms" } as CSSProperties}>
          {first ? <p className="lxf-note">{first}</p> : null}
          <p className="lxf-copy">{data.copyright}</p>
          {rest.map((note) => (
            <p className="lxf-note lxf-note--wide" key={note}>
              {note}
            </p>
          ))}
        </div>
      </div>
    </footer>
  );
}

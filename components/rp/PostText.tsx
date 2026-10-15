'use client';

import { ChevronDown } from 'lucide-react';
import { Fragment, useState } from 'react';

const TOKEN = /(https:\/\/[^\s<>"']+|#[\p{L}\p{N}_]+)/gu;

/** Post text as written: line breaks kept, https links clickable, hashtags set apart. Nothing is parsed as HTML. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (part.startsWith('https://')) {
          const url = part.replace(/[.,;:!?)]+$/, '');
          const tail = part.slice(url.length);
          return (
            <Fragment key={i}>
              <a href={url} target="_blank" rel="noopener noreferrer nofollow">{url}</a>
              {tail}
            </Fragment>
          );
        }
        if (part.startsWith('#')) return <span key={i} className="litag">{part}</span>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** Long posts open and close with an icon-only toggle; short ones show in full. */
export function PostText({ text, limit }: { text: string; limit: number }) {
  const [open, setOpen] = useState(false);
  const long = text.length > limit + 60;
  const shown = open || !long ? text : `${text.slice(0, limit).replace(/\s+\S*$/, '')}…`;
  return (
    <div className="litext">
      <p><Rich text={shown} /></p>
      {long ? (
        <button type="button" className={`rm ${open ? 'open' : ''}`} aria-expanded={open} aria-label={open ? 'Show less' : 'Show more'} onClick={() => setOpen((v) => !v)}>
          <ChevronDown size="1em" strokeWidth={1.7} aria-hidden="true" className="ic" />
        </button>
      ) : null}
    </div>
  );
}

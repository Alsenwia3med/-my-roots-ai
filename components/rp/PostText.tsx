import { Fragment } from 'react';

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

/** Keep long posts as excerpts; the article link opens the full post on its own page. */
export function PostText({ text, limit }: { text: string; limit: number }) {
  const long = text.length > limit + 60;
  const shown = long ? `${text.slice(0, limit).replace(/\s+\S*$/, '')}…` : text;
  return (
    <div className="litext">
      <p><Rich text={shown} /></p>
    </div>
  );
}

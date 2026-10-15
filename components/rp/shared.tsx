/**
 * Shared pieces for the redesigned public pages (How It Works, Platform, Research, About,
 * Healthcare Professionals, Pilot). Copy always comes from lib/content; these helpers only lay
 * it out. Styles live in rp.css and are scoped under `.rp`.
 */

import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  Cpu,
  Eye,
  FileText,
  Globe,
  Info,
  Link2,
  Lock,
  Maximize2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { PageContent, PageZone } from '@/lib/content/c04-pages';
import { Copy } from './RpClient';

export const ICONS = {
  clip: ClipboardCheck,
  shield: ShieldCheck,
  spark: Sparkles,
  file: FileText,
  check: Check,
  x: X,
  arrow: ArrowRight,
  ur: ArrowUpRight,
  lock: Lock,
  expand: Maximize2,
  info: Info,
  eye: Eye,
  cpu: Cpu,
  chev: ChevronDown,
  users: Users,
  globe: Globe,
  link: Link2,
} as const;
export type IconName = keyof typeof ICONS;
const CYCLE: IconName[] = ['clip', 'shield', 'spark', 'file', 'eye', 'cpu', 'link', 'globe'];

export function Ic({ n, className }: { n: IconName; className?: string }) {
  const Icon = ICONS[n];
  return <Icon size="1em" strokeWidth={1.7} aria-hidden="true" className={`ic ${className ?? ''}`} />;
}

export const pad = (n: number) => String(n + 1).padStart(2, '0');
export const short = (t: string, n = 30) => (t.length <= n ? t : `${t.slice(0, n).replace(/\s+\S*$/, '')}…`);

/* ------------------------------------------------------------------ content normaliser */

export interface NZone {
  i: number;
  h: string;
  num: string | null;
  eb: string;
  sub: string;
  lead: string;
  paras: string[];
  items: string[];
  blocks: { label: string; paragraphs: string[] }[];
  closing: string[];
  tone: string;
  span: number;
  empty: boolean;
  icon: IconName;
}
export interface Group {
  id: string;
  type: 'steps' | 'pair' | 'sec';
  zones: NZone[];
  head?: NZone;
  label: string;
  eb: string;
}

export function normalizeZones(zones: PageZone[]) {
  const zs: NZone[] = zones.map((z: PageZone, i) => {
    const m = /^(\d{2})\s—\s(.+)$/.exec(z.heading);
    const o: NZone = {
      i,
      h: m ? m[2] : z.heading,
      num: m ? m[1] : null,
      eb: z.eyebrow ?? '',
      sub: z.sub ?? '',
      lead: z.lead ?? '',
      paras: z.paragraphs ?? [],
      items: z.items ?? [],
      blocks: z.blocks ?? [],
      closing: z.closing ?? [],
      tone: z.tone ?? '',
      span: z.span ?? 12,
      empty: false,
      icon: CYCLE[i % CYCLE.length],
    };
    o.empty = !(o.paras.length || o.items.length || o.blocks.length || o.closing.length || o.lead);
    return o;
  });
  const groups: Group[] = [];
  for (let k = 0; k < zs.length; k++) {
    const z = zs[k];
    const last = groups[groups.length - 1];
    if (z.num) {
      if (last && last.type === 'steps') last.zones.push(z);
      else if (last && last.type === 'sec' && last.zones[0].empty && !last.zones[0].num) {
        last.type = 'steps';
        last.head = last.zones[0];
        last.zones = [z];
      } else groups.push({ id: '', type: 'steps', zones: [z], label: '', eb: '' });
    } else if (z.span === 6 && zs[k + 1] && zs[k + 1].span === 6 && !zs[k + 1].num) {
      groups.push({ id: '', type: 'pair', zones: [z, zs[k + 1]], label: '', eb: '' });
      k++;
    } else groups.push({ id: '', type: 'sec', zones: [z], label: '', eb: '' });
  }
  groups.forEach((g, gi) => {
    g.id = `g${gi}`;
    const f = g.zones[0];
    g.label = g.type === 'steps' ? (g.head ? g.head.h : f.eb || 'The stages') : g.type === 'pair' ? 'Boundaries' : f.h;
    g.eb = g.type === 'steps' ? (g.head ? g.head.eb : f.eb) : f.eb;
  });
  return { zones: zs, groups };
}
export function normalize(page: PageContent) {
  return { page, ...normalizeZones(page.zones ?? []) };
}
export type Normalized = ReturnType<typeof normalize>;

/* ------------------------------------------------------------------ building blocks */

export function Body({
  z,
  dark = false,
  noSub = false,
  itemEmojis,
}: {
  z: NZone;
  dark?: boolean;
  noSub?: boolean;
  itemEmojis?: Record<string, string>;
}) {
  const lim = z.tone === 'limit';
  return (
    <div className="zb">
      {z.sub && !noSub ? <p className="zs">{z.sub}</p> : null}
      {z.paras.map((t, k) => <p key={`p${k}`}>{t}</p>)}
      {z.lead ? <p className="zl">{z.lead}</p> : null}
      {z.items.length ? (
        <ul className={`items ${lim ? 'lim' : ''}`}>
          {z.items.map((t, k) => (
            <li key={`i${k}`} className={`it ${dark ? '' : 'tint'}`}>
              <span aria-hidden="true">{itemEmojis?.[t] ?? <Ic n={lim ? 'x' : 'check'} />}</span>
              {t}
            </li>
          ))}
        </ul>
      ) : null}
      {z.blocks.length ? (
        <div className="blks">
          {z.blocks.map((b) => (
            <div key={b.label} className={`blk ${dark ? '' : 'tint'} lift`}>
              <h4>{b.label}</h4>
              {b.paragraphs.map((t, k) => <p key={`b${k}`}>{t}</p>)}
            </div>
          ))}
        </div>
      ) : null}
      {z.closing.map((t, k) => <p key={`c${k}`} className={k === z.closing.length - 1 ? 'zc' : undefined}>{t}</p>)}
    </div>
  );
}

export function Mesh({ a = 0.2, b = 0.34 }: { a?: number; b?: number }) {
  return (
    <div className="mesh" aria-hidden="true">
      <i className="blob b1" style={{ left: '-8%', top: '-20%', width: 460, height: 460, background: `rgba(25,167,184,${a})` }} />
      <i className="blob b2" style={{ right: '-8%', top: 0, width: 480, height: 480, background: `rgba(143,230,234,${b})` }} />
      <div className="dots" style={{ opacity: 0.5 }} />
    </div>
  );
}

export function Ctas({ page, dark = false }: { page: PageContent; dark?: boolean }) {
  return (
    <div className="ctas">
      {page.ctas.map((c, i) => (
        <Link key={c.href + c.label} className={`btn ${dark ? (i ? 'bo' : 'bw') : i ? 'bs' : 'bp'}`} href={c.href}>
          {c.label}
          {i ? null : <Ic n="arrow" className="arr" />}
        </Link>
      ))}
    </div>
  );
}

/** Opening section: kicker, headline, tagline, copy and actions on the left; an optional visual on the right. */
export function HeroL({ page, kicker, right, cls = '' }: { page: PageContent; kicker: string; right?: React.ReactNode; cls?: string }) {
  return (
    <section className="hero">
      <Mesh />
      <div className={`wrap hg ${cls}`}>
        <div>
          <div className="kick in e1">{page.kicker ?? kicker}</div>
          <h1 className="h1 gt in e2" style={{ margin: '14px 0 12px' }}>{page.headline}</h1>
          {page.tagline ? <p className="tagl in e3">{page.tagline}</p> : null}
          <div className="in e4" style={{ marginTop: 14 }}><Copy intro={page.intro} more={page.introMore ?? []} /></div>
          <div className="in e5" style={{ marginTop: 20 }}><Ctas page={page} /></div>
        </div>
        {right ? <div className="hr">{right}</div> : null}
      </div>
    </section>
  );
}

export function SHead({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <div className="shead rv">
      {kicker ? <div className="kick">{kicker}</div> : null}
      <h2 className="h2 gt" style={{ marginTop: 8 }}>{title}</h2>
      {sub ? <p className="lede" style={{ marginTop: 6, maxWidth: 640 }}>{sub}</p> : null}
    </div>
  );
}

export function Outro({ page }: { page: PageContent }) {
  const o = page.outro;
  return (
    <section className="sec">
      <div className="wrap">
        <div className="outro dp r28 rv" data-glow="">
          <div className="mesh" aria-hidden="true">
            <i className="blob b1" style={{ left: '-8%', top: '-30%', width: 380, height: 380, background: 'rgba(25,167,184,.5)' }} />
            <i className="blob b2" style={{ right: '-8%', bottom: '-30%', width: 380, height: 380, background: 'rgba(143,230,234,.28)' }} />
            <div className="dotsw" />
          </div>
          <div className="in2">
            <div className="halos" aria-hidden="true"><i className="halo" /><i className="halo h2d" /><b><Ic n="arrow" /></b></div>
            {o?.heading ? <h2 className="h2"><span className="gw">{o.heading}</span></h2> : null}
            {o?.text ? <p className="lede">{o.text}</p> : null}
            <div className="ctas" style={{ justifyContent: 'center' }}>
              {page.ctas.map((c, i) => (
                <Link key={c.href + c.label} className={`btn ${i ? 'bo' : 'bw'}`} href={c.href}>
                  {c.label}
                  {i ? null : <Ic n="arrow" className="arr" />}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {page.footnote ? <p className="fnote">{page.footnote}</p> : null}
      </div>
    </section>
  );
}

/** A tidy section row: heading on the left, content on the right. Tone zones sit in a teal box. */
export function Row({ z }: { z: NZone }) {
  const box = z.tone ? `dp r22 ${z.tone === 'limit' ? 'lim' : ''}` : '';
  return (
    <section className="sec rowx">
      <div className="wrap rgrid">
        <div className="rl rv">
          {z.eb ? <div className="kick">{z.eb}</div> : z.num ? <div className="kick">{z.num}</div> : null}
          <h2 className="h2" style={{ marginTop: z.eb || z.num ? 10 : 0 }}><span className="uline">{z.h}</span></h2>
        </div>
        <div className={`rr rv ${box ? `pad ${box}` : ''}`} {...(box ? { 'data-glow': '' } : {})}>
          <Body z={z} dark={!!box} />
        </div>
      </div>
    </section>
  );
}

/** Every zone as a row, with paired halves side by side. */
export function Rows({ zones }: { zones: PageZone[] }) {
  const N = normalizeZones(zones);
  return (
    <>
      {N.groups.map((g) =>
        g.type === 'pair' ? (
          <section className="sec" key={g.id}>
            <div className="wrap pair rvg">
              {g.zones.map((z, i) => (
                <div key={z.i} className={`dp r22 rvi ${z.tone === 'limit' ? 'lim' : ''}`} style={{ ['--i' as string]: i }} data-glow="">
                  <h2 className="h2" style={{ margin: '0 0 14px' }}>{z.h}</h2>
                  <Body z={z} dark />
                </div>
              ))}
            </div>
          </section>
        ) : (
          g.zones.map((z) => <Row key={z.i} z={z} />)
        ),
      )}
    </>
  );
}

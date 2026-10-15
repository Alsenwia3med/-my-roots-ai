'use client';

import { useState } from 'react';
import { Body, Ic, SHead, type NZone } from './shared';

const DOMAIN_EMOJIS: Record<string, string> = {
  'Hunger and appetite regulation': '🍽️',
  'Metabolic regulation': '⚡',
  'Safety and immune-related responses': '🛡️',
  'Inflammatory patterns': '🧬',
  'Sleep and recovery': '🌙',
  'Circadian timing': '☀️',
  'Stress responses': '🧘',
};

const REPORT_EXPLORATION_EMOJIS: Record<string, string> = {
  'How your reported patterns appear across the seven domains': '🧬',
  'Which questionnaire-derived factors the defined rules identify as relevant (not proven causes)': '🔍',
  'Where reported patterns may overlap': '🔗',
  'Which reported strengths and rule-identified protective factors are presented (not verified biological protection)': '🛡️',
  'Where information is incomplete or uncertain': '🧩',
  'Which approved educational actions may support further reflection': '💡',
};

/** Hover, focus or select a stage to immediately show its details. */
export function Pipeline({ id, kicker, title, sub, zones }: { id: string; kicker?: string; title: string; sub: string; zones: NZone[] }) {
  const [current, setCurrent] = useState(0);
  const isPatternStage = (z: NZone) => z.num === '01' && z.h === 'Understand Your Patterns';
  const isReportStage = (z: NZone) => z.h === 'Explore Your Biological Intelligence Report™';
  const selected = zones[current];
  const detailsId = `pipeline-${id}-details`;

  return (
    <section className="sec pipe" id={id}>
      <div className="wrap">
        <SHead kicker={kicker} title={title} sub={sub} />
        <div className="pbox" data-n={zones.length}>
          <div className="prail" aria-hidden="true">
            <div className="rail" />
            <i className="pfill" style={{ width: `${zones.length > 1 ? (current / (zones.length - 1)) * 100 : 100}%` }} />
            <span className="pk" style={{ left: `${zones.length > 1 ? (current / (zones.length - 1)) * 100 : 100}%` }} />
          </div>
          <div className="pgrid" style={{ ['--n' as string]: zones.length }}>
            {zones.map((z, index) => (
              <div key={z.i} className={`stp ${current === index ? 'on' : ''}`}>
                <span className="orb"><Ic n={z.icon} /><i className="hl" /></span>
                <button
                  type="button"
                  className="pc dp"
                  data-glow=""
                  aria-pressed={current === index}
                  aria-controls={detailsId}
                  onMouseEnter={() => setCurrent(index)}
                  onFocus={() => setCurrent(index)}
                  onClick={() => setCurrent(index)}
                >
                  <span className="pn">{z.num}</span>
                  <h3>{z.h}</h3>
                  <span className="pm" aria-hidden="true"><Ic n="expand" /></span>
                </button>
              </div>
          ))}
          </div>
        </div>
        <div className="pdet dp r28 rv" data-glow="" id={detailsId} aria-live="polite">
          <div className="dleft">
            <div className="dbig gw">{selected.num}</div>
            <h3 className="h2" style={{ marginTop: 6 }}>{selected.h}</h3>
            {selected.sub ? <p className="dsub">{selected.sub}</p> : null}
          </div>
          <div className="dright">
            <Body
              z={selected}
              dark
              noSub
              itemEmojis={isPatternStage(selected) ? DOMAIN_EMOJIS : isReportStage(selected) ? REPORT_EXPLORATION_EMOJIS : undefined}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

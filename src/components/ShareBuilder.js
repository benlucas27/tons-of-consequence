'use client';

import { useMemo, useState } from 'react';
import { CardPanel, cardWeighting } from './ShareCard';
import { PRESETS } from '@/lib/scoring';

const TYPES = [
  ['batter', 'One batter'],
  ['compare', 'Batter vs batter'],
  ['innings', 'One innings'],
  ['board', 'ToC leaderboard'],
  ['rankings', 'Greatest hundreds'],
  ['laws', 'The laws'],
];

/** Pick a card type and what it is about, then see the picture. Names are typed with suggestions. */
export default function ShareBuilder({ batters, innings, initial }) {
  const [type, setType] = useState(initial.type || 'batter');
  const [names, setNames] = useState([initial.b1 || 'Virat Kohli', initial.b2 || 'Steve Smith', initial.b3 || 'Joe Root']);
  const [inn, setInn] = useState(initial.inn || '');
  const [law, setLaw] = useState(initial.law || '');
  const [sort, setSort] = useState(initial.sort || 'tons');
  const [preset, setPreset] = useState('Default');
  const weight = cardWeighting(PRESETS[preset].order, PRESETS[preset].bias);

  const bySlugName = useMemo(() => new Map(batters.map((b) => [b.name.toLowerCase(), b.slug])), [batters]);
  const slugOf = (n) => bySlugName.get(n.trim().toLowerCase());
  const innByLabel = useMemo(() => new Map(innings.map((i) => [i.label.toLowerCase(), i.id])), [innings]);

  const setName = (i, v) => setNames((a) => a.map((x, j) => (j === i ? v : x)));
  let params = null; let pageUrl = '/'; let text = 'Tons of Consequence:';
  if (type === 'batter' && slugOf(names[0])) { params = { type, b: slugOf(names[0]) }; pageUrl = `/tons-of-consequence/${params.b}`; text = `${names[0]}'s tons of consequence:`; }
  if (type === 'compare') {
    const slugs = names.map(slugOf).filter(Boolean);
    if (slugs.length >= 2) { params = { type, b: slugs.join(',') }; pageUrl = '/tons-of-consequence'; text = 'Tons of consequence, head to head:'; }
  }
  if (type === 'innings' && innByLabel.get(inn.toLowerCase())) { const id = innByLabel.get(inn.toLowerCase()); params = { type, id: String(id), ...weight }; pageUrl = `/innings/${id}`; text = `${inn}:`; }
  if (type === 'board') { params = { type, sort }; pageUrl = '/tons-of-consequence'; text = 'Who has the most tons of consequence?'; }
  if (type === 'rankings') { params = { type, ...weight }; pageUrl = '/'; text = 'The greatest Test hundreds:'; }
  if (type === 'laws') { params = law ? { type, law } : { type }; pageUrl = '/tons-of-consequence'; text = 'What makes a ton a ton of consequence?'; }

  const nameInput = (i, label) => (
    <label key={i}>{label}
      <input list="share-batters" value={names[i]} onChange={(e) => setName(i, e.target.value)} placeholder="Start typing a name" />
    </label>
  );

  return (
    <div className="share-builder">
      <div className="share-types" role="tablist" aria-label="Card type">
        {TYPES.map(([k, label]) => <button key={k} role="tab" aria-selected={type === k} className={`share-size ${type === k ? 'on' : ''}`} onClick={() => setType(k)}><b>{label}</b></button>)}
      </div>
      <datalist id="share-batters">{batters.map((b) => <option key={b.slug} value={b.name} />)}</datalist>
      <datalist id="share-innings">{innings.map((i) => <option key={i.id} value={i.label} />)}</datalist>
      {type === 'batter' && nameInput(0, 'Batter')}
      {type === 'compare' && <>{nameInput(0, 'First batter')}{nameInput(1, 'Second batter')}{nameInput(2, 'Third batter (optional)')}</>}
      {type === 'innings' && <label>Innings<input list="share-innings" value={inn} onChange={(e) => setInn(e.target.value)} placeholder="e.g. Virat Kohli 235 v England 2016" /></label>}
      {(type === 'innings' || type === 'rankings') && <label>Point of view<select value={preset} onChange={(e) => setPreset(e.target.value)}>{Object.keys(PRESETS).map((n) => <option key={n} value={n}>{n}: {PRESETS[n].blurb}</option>)}</select></label>}
      {type === 'board' && <label>Order by<select value={sort} onChange={(e) => setSort(e.target.value)}><option value="tons">Most tons of consequence</option><option value="share">Highest share of hundreds</option></select></label>}
      {type === 'laws' && <label>Which law<select value={law} onChange={(e) => setLaw(e.target.value)}><option value="">All 13 laws</option>{Array.from({ length: 13 }, (_, i) => <option key={i} value={i + 1}>Law {i + 1}</option>)}</select></label>}
      {params ? <CardPanel key={JSON.stringify(params)} params={params} pageUrl={pageUrl} shareText={text} /> : <p className="conn-note">Pick a name from the suggestions to see the card.</p>}
    </div>
  );
}

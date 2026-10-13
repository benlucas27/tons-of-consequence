import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import InningsView from '@/components/InningsView';
import { BY_ID, parseInningsId, inningsSlug } from '@/lib/dataset';
import { runsText } from '@/lib/format';

const find = (slug) => BY_ID.get(parseInningsId(slug));

export function generateMetadata({ params }) {
  const c = find(params.slug);
  if (!c) return { title: 'Innings not found' };
  const title = `${c.name} ${runsText(c)} v ${c.opponent}, ${c.year}`;
  const description = c.story ? c.story.split('. ').slice(0, 2).join('. ').replace(/\.?$/, '.') : `${c.name} made ${runsText(c)} against ${c.opponent} in ${c.year}. See how it ranks among every Test century.`;
  return {
    title,
    description,
    alternates: { canonical: `/innings/${inningsSlug(c)}` },
    openGraph: { title: `${title} | Tons of Consequence`, description, type: 'article' },
    twitter: { card: 'summary_large_image', title: `${title} | Tons of Consequence`, description },
  };
}

function Skeleton({ c }) {
  return (
    <div className="inn">
      <div className="hero-wrap hero">
        <h1>{c.name}</h1>
        <div className="rline"><span className="rr">{c.runs}{c.notOut ? <small>*</small> : null}</span></div>
      </div>
    </div>
  );
}

export default function Page({ params }) {
  const c = find(params.slug);
  if (!c) notFound();
  return (
    <Suspense fallback={<Skeleton c={c} />}>
      <InningsView id={c.id} />
    </Suspense>
  );
}

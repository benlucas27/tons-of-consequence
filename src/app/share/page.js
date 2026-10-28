import { BATTERS } from '@/lib/consequence';
import { ALL } from '@/lib/dataset';
import { runsText } from '@/lib/format';
import ShareBuilder from '@/components/ShareBuilder';

export const metadata = {
  title: 'Build a graphic',
  description: 'Make a picture of any batter, innings, head-to-head or leaderboard to post anywhere: square or 4:5 portrait size.',
};

export default async function SharePage({ searchParams: sp }) {
  const searchParams = await sp;
  const batters = BATTERS.filter((b) => b.hundreds >= 1).map((b) => ({ name: b.name, slug: b.slug }));
  const innings = ALL.map((c) => ({ id: c.id, label: `${c.name} ${runsText(c)} v ${c.opponent} ${c.year}` }));
  return (
    <article className="prose toc-page">
      <h1>Build a graphic</h1>
      <p className="lede">Build an image of the numbers, ready to post. Pick a type (a batter, an innings, a head-to-head or the ranking), choose a size and download it or share it straight to your phone&rsquo;s apps.</p>
      <ShareBuilder batters={batters} innings={innings} initial={{ type: searchParams?.type }} />
    </article>
  );
}

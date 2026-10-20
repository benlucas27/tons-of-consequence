import Link from 'next/link';
import { MEASURED_TOTAL, TONS_TOTAL } from '@/lib/consequence';
import { BOARD } from '@/lib/batterBoard';
import TocBoard from '@/components/TocBoard';
import { TOTAL } from '@/lib/dataset';
import { THRESHOLD } from '@/lib/consequenceModel';

export const metadata = {
  title: 'ToCs: how a ton of consequence is decided',
  description: 'A ton of consequence (a ToC) is a Test hundred the side needed: it helped them win the match or avoid losing it. Every ToC, the 13 laws behind the call, and how firm each verdict is.',
};

export default function TonsOfConsequence() {
  return (
    <article className="prose toc-page">
      <p className="conn-note">Men&rsquo;s ToCs &middot; <Link href="/womens-tests">Women&rsquo;s ToCs</Link></p>
      <h1>Tons of Consequence</h1>
      <p className="lede">A ton of consequence (a ToC) is a Test hundred of consequence. The side needed it, and it helped them win the match or avoid losing it. There are good tons, but not every ton is a ToC.</p>

      <h2>How a ToC is decided: the 13 laws</h2>
      <p>Law 1 is the only hard law. Laws 2 to 13 add points, law 8 takes points away, and a hundred needs {THRESHOLD} points to count. The bar is set high on purpose.</p>
      <ol className="toc-laws">
        <li><b>A ToC wins or saves a match.</b> You can&rsquo;t score a ToC in a loss or a dead rubber (a dead rubber counts only if his side had already won the series and won the match). A draw counts only if his side was in danger of losing and we can say with confidence that the hundred saved it. It doesn&rsquo;t count against the lower-tier sides, and not if rain or the clock saved the match instead.</li>
        <li><b>A ToC considers the scoreboard when the batter came in, except for openers.</b> Walking in at 3 for 80 matters. Walking in at 1 for 300 doesn&rsquo;t.</li>
        <li><b>A ToC carries the innings.</b> What share of the team&rsquo;s runs did he score? Was he the only hundred? How far clear was he of the next batter? If the rest of the team added very little, it counts for more. If they added a lot, it counts for less.</li>
        <li><b>A ToC is part of a winning chase or a close finish.</b> It doesn&rsquo;t have to finish the job, but it can be what made it possible.</li>
        <li><b>A ToC matters to the series.</b> Deciders and undecided series count more than dead rubbers.</li>
        <li><b>Pace matters, but not always.</b> A fast hundred can change a game. A slow grind can save one.</li>
        <li><b>The moment matters.</b> A tribute, a farewell, a comeback, an emotional match, Boxing Day or New Year.</li>
        <li><b>It&rsquo;s hard to score a ToC if there&rsquo;s no pressure on.</b> If his side already led by more than 200 when he came in, it loses points.</li>
        <li><b>The opening platform.</b> An opener&rsquo;s big first-wicket stand can set up an easy win, and it counts even when the match later looks out of reach.</li>
        <li><b>The late stand.</b> A hundred built in a partnership at the 7th wicket or later earns extra.</li>
        <li><b>The lower order.</b> A hundred from number 7 or lower earns extra.</li>
        <li><b>An elite attack.</b> Only a truly elite attack counts: bowlers who averaged under about 25 in their careers. Ordinary strong attacks earn nothing.</li>
        <li><b>Who it was scored against.</b> A hundred against a weaker side loses points: a lot against Zimbabwe, Bangladesh and the other newer sides, a little against Sri Lanka, West Indies and Pakistan. A side counts as stronger in an era when it was, such as the West Indies up to 2000 and Sri Lanka from 1996 to 2010.</li>
      </ol>
      <p>These laws are judgement calls, not a measurement. Where a verdict is too close to call, it has been decided by hand. Every verdict shows how firm its evidence is, and some famous innings carry links to articles that call them one of the greats.</p>

      <h2>How much can we measure?</h2>
      <p>The ball-by-ball record is close to complete from about 2006, and older hundreds are judged from the result, the series and match reports. We can measure {MEASURED_TOTAL.toLocaleString()} of the {TOTAL.toLocaleString()} hundreds in the database, and {TONS_TOTAL.toLocaleString()} of them are tons of consequence. Don Bradman&rsquo;s 29 are measured by hand, on <Link href="/the-don">The Don</Link>. The rest will follow as their scorecards are collected.</p>

      <h2>Every batter</h2>
      <p className="conn-note">Search for anyone with a Test hundred, or sort by share, best single innings or team win rate. Tap a name to see every hundred and why it was, or wasn&rsquo;t.</p>
      <TocBoard rows={BOARD} />
    </article>
  );
}

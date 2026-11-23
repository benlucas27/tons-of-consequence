import Link from 'next/link';
import { APP_STORE_URL } from '@/lib/site';

export const metadata = {
  title: 'Get the app',
  description: 'Tons of Consequence is free on the App Store: every Test hundred ranked on your weighting, with an alert when a new ton of consequence is added.',
};

export default function GetTheApp() {
  return (
    <article className="prose">
      <h1>Get the app</h1>
      <p className="lede">Every Test hundred, ranked on your weighting, in your pocket. Free, no ads and no accounts.</p>
      <p><a className="btn primary" href={APP_STORE_URL}>Download on the App Store</a></p>

      <ul>
        <li><strong>It works offline.</strong> The whole ranking lives on your phone, and it updates itself when there is new data.</li>
        <li><strong>New ToC alerts.</strong> The app asks if it can send a notification when a new ton of consequence is added. You can turn them off any time under More.</li>
        <li><strong>Share images.</strong> Send any innings, batter or leaderboard as a picture.</li>
      </ul>

      <h2>On Android or a computer?</h2>
      <p>The app is for iPhone. Everything in it is on this website too, so open <Link href="/">the rankings</Link> in your browser, or <Link href="/connect">connect it to Claude</Link>.</p>
      <p className="conn-note">If the button does nothing inside another app (WhatsApp, Instagram, Messages), open this page in Safari, or search the App Store for <b>Tons of Consequence</b>.</p>
    </article>
  );
}

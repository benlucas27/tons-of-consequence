import Link from 'next/link';
import { MCP_URL } from '@/lib/site';

export const metadata = {
  title: 'Privacy',
  description: 'What Tons of Consequence does and does not collect, on the website and through the Claude connector.',
};

export default function Privacy() {
  return (
    <article className="prose">
      <h1>Privacy</h1>
      <p className="lede">Short version: there are no accounts, no ads and no tracking across other sites. We count page views anonymously, with no cookies. We don&rsquo;t ask who you are and we don&rsquo;t keep what you ask.</p>
      <p className="conn-note">Last updated 21 October 2026. Tons of Consequence is an independent project run by Ben Lucas.</p>

      <h2>On the website</h2>
      <ul>
        <li><strong>No accounts, no sign-in, no advertising.</strong></li>
        <li><strong>Anonymous page counts.</strong> We use Vercel Web Analytics to see which pages are read. It uses no cookies and does not follow you across other sites. It records the page, the time, where you came from (the referring site), your rough location (country and region), and your browser, device and operating system. It does not record who you are or your IP address, and the figures are used only as totals. Under Vercel&rsquo;s own policy, a visitor is recognised by a code made from the request, and that code is dropped after 24 hours.</li>
        <li><strong>Your weighting is saved on your own device.</strong> Your chosen order of the six criteria is kept in your browser&rsquo;s local storage so the site remembers it next time. It never leaves your device, and clearing your browser data removes it.</li>
        <li><strong>Voice questions.</strong> If you use the microphone on the Search page, your browser turns your speech into text. In Chrome and Safari that means the audio goes to the browser maker&rsquo;s own speech service. We never receive the audio.</li>
        <li><strong>Videos.</strong> Nothing from YouTube loads until you press play, and then it uses YouTube&rsquo;s privacy-enhanced player. Once it plays, YouTube&rsquo;s own privacy policy applies.</li>
        <li><strong>Hosting.</strong> The site is hosted by Vercel, which keeps standard server logs (such as the page requested, the time and your IP address) to run and secure the service, under its own policy.</li>
      </ul>

      <h2>In the iPhone app</h2>
      <ul>
        <li><strong>No accounts, no ads, no tracking.</strong> The app keeps the whole ranking and your chosen weighting on your phone, and it asks nobody who you are.</li>
        <li><strong>New ToC alerts are optional.</strong> If you switch them on, we use OneSignal to send them. OneSignal receives an anonymous device code (a push token) and basic device details such as your country and language, only to deliver the notification. Switch the alerts off under More in the app, or in iOS Settings, and they stop.</li>
        <li><strong>Share images.</strong> When you share an innings, a batter or a result as an image, the app asks our server to draw it. The request names the innings or batter and your weighting, nothing about you.</li>
        <li><strong>Updates.</strong> The app checks our server for new data and downloads it when there is some. Like the website, our host keeps standard server logs of those requests.</li>
        <li><strong>Location.</strong> The app does not use your location.</li>
      </ul>

      <h2>Through the Claude connector</h2>
      <p>The <Link href="/connect">Claude connector</Link> is a read-only service at <code>{MCP_URL}</code>. When you ask Claude something that needs it, Claude sends us the details of the lookup, such as a player&rsquo;s name, a country, a year or the weighting you want.</p>
      <ul>
        <li><strong>What we receive:</strong> only the lookup itself. Not your name, your Claude account, your email or the rest of your conversation.</li>
        <li><strong>What we do with it:</strong> work out the answer from the ranking and send it straight back. We don&rsquo;t store, sell or share it, and we don&rsquo;t build a profile of you.</li>
        <li><strong>What our host keeps:</strong> the same standard server logs as for the website (see above).</li>
        <li><strong>What it can&rsquo;t do:</strong> it can&rsquo;t change anything. Every tool is read-only.</li>
        <li><strong>No sign-in.</strong> Anyone with the address can use it, so please don&rsquo;t put personal information into a question.</li>
      </ul>

      <h2>Where the information comes from</h2>
      <p>Cricket data is compiled from public cricket records and from <a href="https://cricsheet.org">Cricsheet</a>, used under the Open Data Commons Attribution licence. The scores and stories are this project&rsquo;s own opinion.</p>

      <h2>Contact</h2>
      <p>Questions, corrections or requests: email <a href="mailto:ben@haveaplan.xyz">ben@haveaplan.xyz</a>, or open an issue at <a href="https://github.com/benlucas27/tons-of-consequence/issues">github.com/benlucas27/tons-of-consequence</a>. We&rsquo;ll update this page if any of the above changes.</p>
    </article>
  );
}

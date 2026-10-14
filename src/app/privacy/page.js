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
      <p className="lede">Short version: there are no accounts, no ads and no tracking. We don&rsquo;t ask who you are and we don&rsquo;t keep what you ask.</p>
      <p className="conn-note">Last updated 14 October 2026. Tons of Consequence is an independent project run by Ben Lucas.</p>

      <h2>On the website</h2>
      <ul>
        <li><strong>No accounts, no sign-in, no advertising, no analytics.</strong></li>
        <li><strong>Your weighting is saved on your own device.</strong> Your chosen order of the six criteria is kept in your browser&rsquo;s local storage so the site remembers it next time. It never leaves your device, and clearing your browser data removes it.</li>
        <li><strong>Voice questions.</strong> If you use the microphone on the Search page, your browser turns your speech into text. In Chrome and Safari that means the audio goes to the browser maker&rsquo;s own speech service. We never receive the audio.</li>
        <li><strong>Videos.</strong> Nothing from YouTube loads until you press play, and then it uses YouTube&rsquo;s privacy-enhanced player. Once it plays, YouTube&rsquo;s own privacy policy applies.</li>
        <li><strong>Hosting.</strong> The site is hosted by Vercel, which keeps standard server logs (such as the page requested, the time and your IP address) to run and secure the service, under its own policy.</li>
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
      <p>Cricket data comes from ESPNcricinfo&rsquo;s Statsguru and from <a href="https://cricsheet.org">Cricsheet</a>, used under the Open Data Commons Attribution licence. The scores and stories are this project&rsquo;s own opinion.</p>

      <h2>Contact</h2>
      <p>Questions, corrections or requests: email <a href="mailto:ben@haveaplan.xyz">ben@haveaplan.xyz</a>, or open an issue at <a href="https://github.com/benlucas27/tons-of-consequence/issues">github.com/benlucas27/tons-of-consequence</a>. We&rsquo;ll update this page if any of the above changes.</p>
    </article>
  );
}

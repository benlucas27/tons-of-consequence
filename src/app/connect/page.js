import Link from 'next/link';
import CopyField from '@/components/CopyField';
import { MCP_URL } from '@/lib/site';

export const metadata = {
  title: 'Connect to Claude',
  description: 'Add Tons of Consequence to Claude in a minute. Then ask it anything about Test centuries and it answers from the ranking, on your weighting.',
};

const EXAMPLES = [
  'Who has the better Test hundred, Ricky Ponting or Steve Smith?',
  'Show me the five most clutch centuries by Indian batters since 2010.',
  'Rank the top 10 Test centuries as a Romantic would, then as an Analyst. What changed?',
  'Which hundreds do people argue about most?',
  "Tell me the story behind Matt Renshaw's 190 and how it ranks.",
  'Compare Lara 153, Stokes 135 and Waugh 200. Does the verdict hold under every preset?',
  'Compare the Big Four, Smith, Kohli, Root and Williamson. Who converts fifties into hundreds best?',
];

const TOOLS = [
  ['ask', 'Answers a plain-English question and says how it understood it.'],
  ['rank_centuries', 'Ranks innings under a preset or your own weighting, with filters.'],
  ['get_century', 'Everything about one innings: story, scores, rank under every preset, video.'],
  ['compare_centuries', 'Head to head, with a verdict and whether it holds under every preset.'],
  ['compare_careers', 'Whole careers side by side, such as the Big Four: averages, conversion of fifties, and how their hundreds rank.'],
  ['most_divisive', 'The innings people disagree about most.'],
  ['list_options', 'How the model works: criteria, presets, the Australian bonus.'],
];

export default function ConnectPage() {
  return (
    <div className="prose connect">
      <h1>Connect to Claude</h1>
      <p className="lede">Add Tons of Consequence to Claude and ask it anything about Test centuries. It answers from this ranking, on your weighting, and links every innings it mentions.</p>

      <section className="conn-card" aria-labelledby="addr">
        <h2 id="addr">The address to add</h2>
        <CopyField value={MCP_URL} label="Connector address" />
        <p className="conn-note">Anyone can add it. There is nothing to sign in to and nothing to pay us.</p>
      </section>

      <h2>In the Claude app or on claude.ai</h2>
      <p>This works on the web, the desktop app and mobile, on the Free, Pro and Max plans. A Free account can have one custom connector.</p>
      <ol className="steps">
        <li>Open Claude and go to <b>Customize</b>, then <b>Connectors</b>.</li>
        <li>Click <b>Add custom connector</b>.</li>
        <li>Paste the address above. Call it <b>Tons of Consequence</b>. If it asks how people sign in, choose <b>No sign-in</b>.</li>
        <li>Click <b>Add</b>.</li>
        <li>In a chat, press <b>+</b>, then <b>Connectors</b>, and make sure Tons of Consequence is switched on. Then ask a question.</li>
      </ol>
      <p className="conn-note"><b>On a Team or Enterprise plan?</b> An Owner adds it once under <b>Organization settings</b>, then <b>Connectors</b>, then <b>Add</b>, then <b>Custom</b>. After that everyone can connect from <b>Customize</b>, then <b>Connectors</b>. If the menu names look different, Anthropic&rsquo;s <a href="https://claude.com/docs/connectors/custom/add-unlisted">guide to custom connectors</a> has the current ones.</p>

      <h2>In Claude Code</h2>
      <p>One command adds the connector:</p>
      <CopyField value={`claude mcp add --transport http tons-of-consequence ${MCP_URL}`} label="Claude Code command" />
      <p>Or install the plugin, which adds the same connector and a short guide that tells Claude when to use it:</p>
      <CopyField value="/plugin marketplace add benlucas27/tons-of-consequence" label="Add the marketplace" />
      <CopyField value="/plugin install tons-of-consequence@tons-of-consequence-marketplace" label="Install the plugin" />

      <h2>Things to ask</h2>
      <ul className="eg-plain">
        {EXAMPLES.map((q) => <li key={q}>{q}</li>)}
      </ul>

      <h2>What Claude can do with it</h2>
      <dl className="conn-tools">
        {TOOLS.map(([name, what]) => (
          <div key={name}><dt><code>{name}</code></dt><dd>{what}</dd></div>
        ))}
      </dl>

      <h2>What it does and doesn&rsquo;t do</h2>
      <ul>
        <li><strong>It only reads.</strong> It can look things up and compare them. It can&rsquo;t change a score, the data or this site.</li>
        <li><strong>Claude does the talking, the model does the scoring.</strong> Claude understands your question and explains the answer. The scores come from the ranking, so the same question gets the same numbers here and on the site.</li>
        <li><strong>It is the same data as the site.</strong> When the site updates each month, so does the connector.</li>
        <li><strong>Your privacy.</strong> Claude sends the connector the search terms for your question, such as a player or a year. It never gets your name, your account or your chats from us, and we don&rsquo;t store what you ask. Our host keeps standard request logs.</li>
        <li><strong>It is unofficial.</strong> This is an independent project, not made or endorsed by Anthropic. Anthropic&rsquo;s own advice is to connect only to services you trust, so it is worth a look at <Link href="/about">how this one works</Link> first.</li>
      </ul>
    </div>
  );
}

# Connectors Directory submission: ready to paste

Portal: https://claude.ai/directory/manage, then **Submit new**, then **MCP connector**. Requires a paid Claude plan.
Steps and requirements: https://claude.com/docs/connectors/building/submission

A listing is what makes the connector **findable inside Claude** (Customize, then Connectors). Without it, people need the
address from the /connect page. Submission is a review request, and by default a passing submission is listed as a
**Community** connector. Verified status is a separate step.

Before submitting, run `node scripts/test-mcp.mjs` (checks the live connector over real HTTP), and confirm /privacy and
/connect are live on production.

## 1. Connection
- **Server URL:** `https://tons-of-consequence.vercel.app/mcp`
- Users connect to the same URL: yes.

## 2. Tools
Synced from the server. All seven have a `title` and `readOnlyHint: true`: ask, rank_centuries, get_century,
compare_centuries, compare_careers, most_divisive, list_options.
Nothing writes, so there are no `destructiveHint` tools.

## 3. Listing
- **Name (max 100):** Tons of Consequence
- **One-liner (max 200):** Rank, compare and explore every Test cricket century. Ask Claude about innings, players and careers, scored on your own weighting.
- **Description (max 2,000):**

  Tons of Consequence is an unofficial, opinionated ranking of every Test cricket century, more than 4,600 of them. Instead of ranking hundreds by runs, it scores each innings on six criteria: match impact, clutchness, narrative, conditions and opposition, historical weight and perceived greatness. You put the six in order of importance and every innings is ranked your way.

  Connect it to Claude and ask in plain English:
  - Who has the better Test hundred, Ricky Ponting or Steve Smith?
  - Rank the top 10 centuries as a Romantic would, then as an Analyst. What changed?
  - Show me the most clutch hundreds by Indian batters since 2010.
  - Compare the Big Four (Smith, Kohli, Root and Williamson): who converts fifties into hundreds best?

  Claude can rank innings under five points of view (Default, Purist, Analyst, Patriot and Romantic) or your own order of the criteria, look up the story and scores behind any innings, compare innings or whole careers head to head with a written verdict, and find the hundreds people argue about most. Every answer says which weighting it used, and links to the innings on the website.

  It only reads. It can't change a score, the data or the site, and it needs no sign-in. The scores are the project's opinion, and the data is refreshed monthly. Independent project, not made or endorsed by Anthropic.

- **Categories (1 to 5):** Sports (and the closest of: Data and analytics, Entertainment). Choose from what the portal offers.
- **Documentation URL:** `https://tons-of-consequence.vercel.app/connect`
- **Privacy policy URL:** `https://tons-of-consequence.vercel.app/privacy`
- **Support contact:** `ben@haveaplan.xyz` (the GitHub issues page, `https://github.com/benlucas27/tons-of-consequence/issues`, is the public alternative)
- **Icon:** `public/connector-icon.png` (512 x 512), also served at `https://tons-of-consequence.vercel.app/connector-icon.png`
- **URL slug (permanent once published):** `tons-of-consequence`

## 4. Use cases
- Settling cricket arguments: which of two innings, or two batters, mattered more.
- Exploring the ranking from a point of view: rank under a preset or your own order of the six criteria.
- Finding the story and context behind a famous innings.
- **What users need before they connect:** nothing. No account, plan or setup beyond adding the address.
- **Reads or writes:** reads only.

## 5. Company
- **Company name:** Tons of Consequence (an independent project by Ben Lucas)
- **Website:** `https://tons-of-consequence.vercel.app`
- **Primary contact for review updates:** ben@haveaplan.xyz

## 6. Authentication
**No authentication.** The data is public cricket statistics and the service is read-only. (If the portal asks about
Anthropic's approval for this mode, it is not needed.)

## 7. Data handling
- The underlying data is the project's own dataset, compiled from public cricket records and
  Cricsheet (Open Data Commons Attribution licence). No third-party API is called when a request is made.
- Personal health data: no. Sponsored content: no.

## 8. Test and launch
- **Reviewer instructions:** In Claude, go to Customize, then Connectors, then Add custom connector. Paste
  `https://tons-of-consequence.vercel.app/mcp`, choose **No sign-in**, and add it. In a chat, press + then Connectors and
  switch Tons of Consequence on. No account or credentials are needed.
- **Prompts that exercise every tool:**
  1. "Who has the better Test hundred, Ricky Ponting or Steve Smith?" (ask, compare_centuries)
  2. "Rank the top 5 centuries as a Romantic would." (rank_centuries)
  3. "Tell me about Matt Renshaw's 190." (get_century)
  4. "Compare the Big Four batters." (compare_careers)
  5. "Which hundreds are the most divisive?" (most_divisive)
  6. "How does the ranking work?" (list_options)
- **Confirm you have run every tool:** done with `node scripts/test-mcp.mjs` and in Claude as a custom connector.

## 9. Compliance (Ben must tick all seven)
Directory guidelines; first-party API usage; financial transactions (none); AI media generation (none); prompt injection
(tool results are plain data, and no tool takes actions); conversation data collection (none: see /privacy); public
documentation (/connect).

# Setting up the X account and the automatic posting

Posts go out from a GitHub job (`.github/workflows/x-post.yml`), three a day, from the approved items in `social/x-queue.json`. Each post is a share card plus a short caption. Nothing is ever a reply, mention, follow or like.

## What Ben does (once)
1. **Create the X account.** Username must be 15 characters or fewer. Use `@TonsOfConseq` (12). Backups: `@ToCRanking` (11), `@TestToCs` (9). Set the display name to "Tons of Consequence".
2. **Mark it as automated.** In X: Settings > Your account > Account information > Automation. Choose "Managed by" and your own personal account. This is X's rule for accounts that post automatically, and it keeps the account in good standing.
3. **Profile.** Put https://tonsofconsequence.com in the bio link, and use the site's ball logo. Posts themselves carry no link because X charges more for posts with links, and the card has the domain on it.
4. **Apply for developer access** at developer.x.com while signed in as that account. Describe the use as: "Posts one image card and caption a few times a day from the account's own queue. No replies, mentions, follows or scraping."
5. **Buy credits.** X charges per request (third-party sources put a plain post at about 1.5 cents and a post with a link at about 20 cents; check the console for the real prices). Three image posts a day is a small monthly bill. Set a low spending cap if the console offers one.
6. **Create the four keys.** In the developer console, make an app, set its permissions to Read and write, and generate: API key, API key secret, Access token, Access token secret. The access token must be generated AFTER the permission is set to Read and write.
7. **Put the keys into GitHub as secrets** (repo > Settings > Secrets and variables > Actions > New repository secret), with exactly these names: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`. Do not paste them anywhere else, including chat.

## Then, to test without posting anything
GitHub > Actions > Post to X > Run workflow > mode `verify` (checks the keys and prints the account name), then `dry-run` (fetches a real card and prints the post without sending it).

## To start
1. Approve posts: tell Claude "approve days 1 to 7" (or edit `social/x-queue.json` and set `approved` to true).
2. Set `startDate` to the first day you want and `paused` to false.
3. The first post goes out at the next slot (03:35, 09:05 or 15:35 UTC). To stop everything, set `paused` to true.

## Safety rules built into the job
- Only approved items post. A post more than 36 hours late is skipped, not sent out of context.
- At most 3 posts in any 24 hours.
- Captions carry no numbers or verdicts; those are only on the card, which is drawn from the live data at the moment of posting, so a changed ruling can never contradict the caption.
- The posted record is saved back to the queue with `[skip ci]` in the commit message so it does not trigger a site redeploy (check the first run on Vercel to confirm that works).
- The cards have to be live on tonsofconsequence.com first: merge `share-cards` to main and deploy before the first post.

## Needs checking once the keys exist
X's documentation does not state in plain words that the older OAuth 1.0a keys work for the image upload and post endpoints (it lists "UserToken"). The `verify` and `dry-run` steps will show quickly; if X rejects them the fix is a small change to OAuth 2 user tokens.

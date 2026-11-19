# App Store submission checklist (draft, 19 Nov 2026)

Draft for Ben. Nothing here has been done or submitted. State is taken from docs/MOBILE-APP-STATUS.md (22 Oct 2026) and was NOT re-checked
in App Store Connect, so tick each line against what the screen shows. App Store Connect app id 6825257483, bundle id com.tonsofconsequence.app.
Copy for every text field is in docs/APP-STORE-LISTING.md.

## 0. Before anything else: bring the site back (Ben only)
The app's feed (/api/feed) and share images come from tonsofconsequence.com, which is showing "Deployment Paused". Apple's reviewer would hit a dead backend.
- [ ] Vercel > team plannerapp22s-projects > Settings > Billing: fix or replace the card (Mastercard debit ending 9216 was declined on 17 Nov), click Reactivate Pro.
- [ ] Open https://tonsofconsequence.com and https://tonsofconsequence.com/api/feed/version: both load.
- [ ] Next daily update run and "Post to X" workflow succeed (the X failures since 16 Nov are a separate issue, not covered here).

## 1. Check where things stand (Ben signs in; Claude can then look)
- [ ] Sign in to https://appstoreconnect.apple.com (Ben types the password and code; Claude cannot).
- [ ] Open the app (id 6825257483). Look for any email or message from Apple, and for the version's status (Prepare for Submission, Waiting for Review, Rejected, etc.).
- [ ] TestFlight tab: confirm build 3 (location purpose string fix, ITMS-90683) finished processing and shows no "Missing Compliance" warning
      (app.json already sets ITSAppUsesNonExemptEncryption to false).
- [ ] If a newer build is wanted (any app change since 22 Oct), from `mobile/`:
      `npx eas-cli@latest build --platform ios --profile production --non-interactive`, then
      `npx eas-cli@latest submit --platform ios --profile production --id <build id> --non-interactive` (no Apple sign-in needed).

## 2. Merge decision (Claude asks Ben first)
- [ ] The `mobile-app` branch is unmerged to `main` (it only adds mobile/ and docs). Decide whether to merge it before release, so the shipped code is on main.

## 3. App Store Connect: App Information
- [ ] Name: Tons of Consequence. Subtitle: Every Test hundred, ranked (28 of 30). Subtitle sits on the version's localised info, not the App Information page.
- [ ] Categories: Sports (primary), Entertainment (secondary).
- [ ] Content Rights: answer that the app does not contain, show or access third-party content that needs rights (confirm Ben is happy with that answer for the cricket data).
- [ ] Age Rating questionnaire: answer No to every question. Expected result: 4+.
- [ ] Privacy policy URL: https://tonsofconsequence.com/privacy (the app paragraph is already live on main, 1c593dc; check it loads once the site is back).

## 4. App Store Connect: Pricing and Availability
- [ ] Price: Free. Availability: all territories unless Ben wants fewer.

## 5. App Store Connect: App Privacy
- [ ] Data collected: Yes. Identifiers > Device ID (push token), for App Functionality, not linked to identity, not used for tracking.
- [ ] Nothing else collected. No tracking, so no ATT prompt.
- [ ] CHECK before saving: OneSignal's SDK can also collect country, language and IP address for delivery. The draft answers in the listing doc list only Device ID.
      Compare against OneSignal's own Apple privacy guidance and add any extra data types it names. The privacy page paragraph already mentions country and language.

## 6. App Store Connect: the version page (1.0)
- [ ] Screenshots: 6.9-inch iPhone set, 6 images (plan in the listing doc: Rankings, innings page, ToCs leaderboard, Compare, Ask, batter page or share image).
      Taken from the TestFlight build on Ben's iPhone. Needs the phone and the site live.
- [ ] Promo text, description, keywords, support URL, marketing URL, copyright: already saved on 22 Oct. Re-read them for typos; "ToC" only, Australian spelling.
- [ ] What's New (first release): paste from the listing doc.
- [ ] Build: choose build 3 (or the newest) under Build.
- [ ] App Review Information: contact name, phone (Apple requires one) and ben@haveaplan.xyz; sign-in not required; paste the review notes from the listing doc.
- [ ] Version release: choose manual release (Ben picks the go-live moment) or automatic after approval.

## 7. Submit (only when Ben says)
- [ ] Add for Review, then Submit to App Review. Typical wait is 24 to 48 hours.
- [ ] While in review: keep the site live (Vercel paid up) and do not push app-breaking changes to /api/feed.

## 8. After approval
- [ ] If manual release: click Release this Version.
- [ ] Install from the App Store (not TestFlight) and confirm alerts still work.
- [ ] Add the App Store link to the site, socials and the Reddit/X posts.

## Likely rejection risks to pre-empt
- Site down during review (step 0).
- Privacy answers not matching what OneSignal collects (step 5).
- Location permission string present although the app does not use location: the text already says so plainly; mention it in the review notes if Apple asks.
- Push permission asked too early: the app only asks when the reader switches alerts on under More (already how it works).

# Mobile app: where things stand (21 Oct 2026, afternoon; paused in case credits run out)

Branch `mobile-app` (NOT pushed to GitHub; main has only the feed + push sender + ToC spelling rule). App ID `com.tonsofconsequence.app`,
Expo SDK 57, Expo project linked, Ben signed in to Expo (blucas27). Test in Expo Go: `cd mobile && npx expo start --no-dev --minify`.
(Dev mode in Expo Go freezes taps because it is slow; no-dev mode is fine.)

## Live on main
- /api/feed + /api/feed/version (feed for the app), scripts/notify-new-tons.mjs + notify step in season-update.yml and monthly-update.yml
  (hook wording: "<Name> scores <runs>" / "v <opp>, <venue>. Was it a ToC? Where does it rank?"), tests/toc-spelling.test.mjs ("ToC" only).

## Done in the app (mobile/)
Rankings (presets, own order, filters), ToCs leaderboard (+ latest hundreds), batter page, innings page, Compare (innings + careers),
Ask, Pub Test (+ share image), Women's, Hello Cricket, About + 13 laws, More (New ToC alerts switch), share previews, icon + splash,
OneSignal App ID in app.json, eas.json (production/preview), expo-doctor 21/21.

## Release progress
- Apple Developer renewed. APNs key "ToC push" (Key ID B42PJ5PRUB, Team ID Y29GMVK28N, Sandbox & Production) created; .p8 is in Ben's Downloads
  and uploaded to OneSignal (iOS settings saved). GitHub secrets ONESIGNAL_APP_ID and ONESIGNAL_API_KEY exist.
- EAS iOS build #2 (profile production) started; credentials and profiles created. Build page:
  https://expo.dev/accounts/blucas27s-team/projects/tons-of-consequence/builds/e9d58323-2137-4562-af02-fc3b092cbcf9
  The build runs in Expo's cloud and finishes by itself even if the terminal closes.

## Next steps (in order)
1. Check the build finished (link above, or `cd mobile && npx eas-cli@latest build:list --platform ios --limit 1`).
2. Submit to TestFlight: `cd mobile && npx eas-cli@latest submit --platform ios --profile production --latest`. Ben signs in to Apple in the Terminal
   (codes: use each 6-digit code once, wait for a fresh one). It may offer to create the App Store Connect app record: accept it (name "Tons of Consequence").
3. Ben installs from the TestFlight app, turns on More > New ToC alerts, sends a test from OneSignal (Messages > New Push).
4. App Store paperwork: docs/APP-STORE-LISTING.md (approved by Ben); add the privacy paragraph to /privacy on the site (needs Ben's OK, live text);
   take the 6 screenshots from TestFlight; fill App Store Connect (description, keywords, privacy answers); submit for review ONLY when Ben says.
5. Before the first release: merge mobile-app into main (it only adds mobile/ and docs), after asking Ben.

## Update (21 Oct 2026, later)
Build #2 finished and was SUBMITTED to App Store Connect (TestFlight processing). App Store Connect app id 6825257483:
https://appstoreconnect.apple.com/apps/6825257483/testflight/ios . Next: add Ben as an internal tester (TestFlight > Internal Testing > +), install from the
TestFlight app, test alerts, then screenshots and listing (docs/APP-STORE-LISTING.md).

## Overnight update (21-22 Oct 2026)
- Push tested end to end on Ben's iPhone (subscribe, notification, tap opens the innings). Daily/monthly update notify step is live.
- Privacy page now covers the app (live on main, 1c593dc).
- Build 3 (location purpose string fix) built and submitted to TestFlight (non-interactive; eas.json has ascAppId 6825257483, EAS holds an App Store Connect API key).
  Future builds: `cd mobile && npx eas-cli@latest build --platform ios --profile production --non-interactive` then
  `npx eas-cli@latest submit --platform ios --profile production --id <build id> --non-interactive` (no Apple sign-in needed).
- App Store Connect (app id 6825257483), filled and saved: promo text, description, keywords, support/marketing URL, copyright, categories (Sports + Entertainment).
- NOT done (Ben decides / needs the phone): subtitle ("Every Test hundred, ranked" - field was not found on the App Information page, probably under the localised
  version info), Content Rights, Age Rating questionnaire (answer all No), App Privacy answers (docs/APP-STORE-LISTING.md), privacy policy URL
  (https://tonsofconsequence.com/privacy), review contact + notes, pricing (Free), the 6 screenshots, choose the build for the version, then "Add for Review".
- mobile-app branch is still unmerged to main (asks Ben first). Submit for review only when Ben says.

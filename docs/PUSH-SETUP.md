# Push notifications: what Ben sets up (plain steps)

Nothing here needs code. You make three things: an Apple push key, a free OneSignal account, and two GitHub secrets.
Claude never sees your passwords or the secret key.

## 1. Apple push key (about 5 minutes)
1. Go to https://developer.apple.com/account and sign in.
2. Click **Certificates, Identifiers & Profiles**, then **Keys** in the left list.
3. Click the blue **+** button. Name it `ToC push`. Tick **Apple Push Notifications service (APNs)**. Click **Continue**, then **Register**.
4. Click **Download**. You get a file ending `.p8`. You can only download it ONCE: keep it safe (Downloads is fine for now).
5. On that page note the **Key ID** (10 letters/numbers). Then click your name (top right) > **Membership details** and note your **Team ID** (10 letters/numbers).

## 2. OneSignal (free, about 10 minutes)
1. Go to https://onesignal.com and sign up (free).
2. **New App**. Name: `Tons of Consequence`. Choose **Push**. Click **Next**.
3. Choose **Apple iOS (APNs)**. Choose **.p8 Auth Key**. Upload your `.p8` file. Type the **Key ID**, the **Team ID**, and the Bundle ID `com.tonsofconsequence.app`. Click **Save**.
4. When it asks which SDK, choose **React Native** (or **Expo**) and click **Save & continue**. You can stop at the steps screen.
5. Open **Settings > Keys & IDs**. You will see an **OneSignal App ID** and a **REST API Key**.

## 3. Tell Claude the App ID, and add two GitHub secrets
- The **App ID** is not secret. Paste it to Claude and Claude puts it in the app.
- Secrets (so the daily update can send alerts): go to https://github.com/benlucas27/tons-of-consequence/settings/secrets/actions (signed in as benlucas27), click **New repository secret** twice:
  1. Name `ONESIGNAL_APP_ID`, value = the App ID.
  2. Name `ONESIGNAL_API_KEY`, value = the REST API Key. Do NOT paste this key into chat.

## 4. After that
Claude runs the TestFlight build (you sign in to Expo and Apple when asked). On your iPhone you install it from TestFlight, open
**More**, switch on **New ToC alerts**, and allow notifications. A test message can be sent from OneSignal (Messages > New Push).

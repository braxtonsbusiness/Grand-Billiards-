# Grand Billiards: Luxury 8 Ball

A Firebase Hosting-ready luxury black-and-gold 8-ball pool web game. It includes a playable canvas table, rewarded-ad gates before each match, ad-earned boosts, end-match rewards, and payout request records for PayPal or Cash App admin review.

## Features

- Full-screen luxury pool hall UI with black felt, gold trim, and premium HUD.
- Playable 8-ball challenge with cue aiming, ball collisions, pockets, scratch/ball-in-hand handling, and a legal 8-ball win condition after clearing object balls.
- Rewarded ad flow before every match.
- Ball in hand boost and aim longer boost, each earnable by watching an ad when inventory is empty.
- End-match reward draw for either 3 ball-in-hands, 3 aim-longers, or a wallet credit.
- Firebase-ready persistence service for profiles, match results, and payout requests.
- PayPal and Cash App payout request form that saves pending requests for admin review.

## Firebase setup

1. Create a Firebase project and enable Firestore and Hosting.
2. Replace the placeholder values in `src/services/firebaseService.js` with your Firebase web app config.
3. Add Firebase Authentication before production so Firestore rules can bind profile and payout writes to verified users.
4. Deploy with:

```bash
npm run build
firebase deploy
```

## AdMob / rewarded ads

The current `RewardedAdService` is a browser-safe simulator with an AdMob-style ad unit placeholder. For mobile release, wrap this game with Capacitor or a native shell and replace the simulator with the Google Mobile Ads rewarded ad SDK. For a web-only release, use Google Ad Manager / AdSense-compatible rewarded inventory where available.

## Real-money reward compliance

The payout form records player requests only. Before enabling real PayPal or Cash App transfers, add admin approval, fraud checks, age and location eligibility, tax reporting, terms of service, and legal review for sweepstakes, contest, or gambling laws in each launch region.

## Run locally without package installs

This project uses plain browser modules and zero npm dependencies, so it can run even when package registries are blocked:

```bash
npm run dev
```

Open `http://localhost:5173`, watch the simulated rewarded ad, then play the rack. Use `npm run build` to copy the static app to `dist/` for Firebase Hosting.

## Install as an Android app

This repository now includes a native Android WebView wrapper in `android/` that loads the same game from `android/app/src/main/assets/www/index.html`.

### Build a debug APK

1. Install Android Studio and open this repository folder.
2. Let Android Studio install the Android Gradle Plugin and Android SDK if prompted.
3. Sync the latest web assets into the Android project:

```bash
npm run android:sync
```

4. Build the debug APK from Android Studio, or run:

```bash
npm run android:debug
```

5. Copy `android/app/build/outputs/apk/debug/app-debug.apk` to your phone, open it, and allow installing from your file manager if Android asks.

### Connect real AdMob before release

The Android app currently uses the same rewarded-ad simulator as the web version. Before publishing to Google Play, replace that simulator with Google Mobile Ads rewarded ads and use your real AdMob app ID / rewarded ad unit ID. Keep payout requests behind admin review and legal compliance checks before enabling real-money transfers.

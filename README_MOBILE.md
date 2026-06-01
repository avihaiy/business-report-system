Mobile build instructions (Capacitor)

This project is a web app (Vite + React). To package it as native apps for Android and iOS we use Capacitor.

Prerequisites
- Node.js (16+)
- Java + Android SDK / Android Studio for Android builds
- Xcode on macOS for iOS builds

Quick setup
1. Install dependencies:

```bash
npm install
```

2. Build web assets and initialize Capacitor (only once):

```bash
npm run build
npx cap init "Business Report System" com.avihai.businessreportsystem
```

3. Add native platforms:

```bash
npm run cap:add:android
# On macOS for iOS:
npm run cap:add:ios
```

4. Copy web assets and open the native project:

```bash
npm run cap:sync
npm run cap:open:android
# or on macOS:
npm run cap:open:ios
```

5. Build and run from Android Studio (or Xcode for iOS).

Notes
- iOS builds require a Mac with Xcode and proper signing setup.
- This repository includes `capacitor.config.json` with `webDir: dist` so Capacitor will use the production build artifacts.
- If you want CI-built APKs/IPAs, we can add GitHub Actions; Android can be built on Linux runners, iOS requires macOS runners or external service.

PWA / Native-like behavior
- A `manifest.json` and mobile meta tags were added so the web app can be installed to home screen in browsers that support PWAs.
- A simple bottom navigation bar is shown on mobile to provide an app-like navigation experience.

Quick tips
- To test PWA/install behavior locally, build and serve the `dist` folder over HTTPS or use `vite preview` and open in Chrome/Edge and check the "Install" option in the address bar.
- For true native builds (with access to native APIs), continue with the Capacitor steps above.

Want me to prepare a GitHub Actions workflow to automatically build Android APKs and attach them to releases? If yes, I will add the workflow and required secret instructions.
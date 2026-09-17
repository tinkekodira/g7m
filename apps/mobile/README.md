# @g7m/mobile

Capacitor 7 shell for iOS and Android. Deliberately thin: native
configuration, icons, splash screens and plugin registration. No application
code — that is `apps/web`, built and copied in.

What the shell adds, beyond running the same bundle
([ADR-0074](../../DECISIONS.md#adr-0074--the-native-shell-what-the-phone-does-that-a-browser-cannot)):

| Plugin | What it is for |
| --- | --- |
| `@capacitor/haptics` | A real buzz, including on iOS, where `navigator.vibrate` does not exist |
| `@capacitor/status-bar` | The bar follows the app's theme instead of staying black |
| `@capacitor/splash-screen` | Held until the app has something to show, then faded |
| `@capacitor/keyboard` | The view shrinks so the set being typed stays visible |
| `@capacitor/app` | Android's back gesture, and the URL a sign-in comes back on |
| `@capacitor/browser` | The Google sign-in, in the system browser rather than in the app |
| `@capacitor-community/keep-awake` | The screen stays on during a workout — the web API does not exist on iOS |

## Prerequisites

| Target | Needs |
| --- | --- |
| Android | JDK 21, Android SDK 35. Android Studio brings both. |
| iOS | macOS, Xcode 16+, CocoaPods. **Cannot be built on Windows.** |

## Commands

```bash
pnpm --filter @g7m/mobile sync          # build apps/web, then copy + update native projects
pnpm --filter @g7m/mobile assets        # regenerate every icon and splash screen from assets/
pnpm --filter @g7m/mobile open:android  # open in Android Studio
pnpm --filter @g7m/mobile open:ios      # open in Xcode (macOS only)
pnpm --filter @g7m/mobile run:android   # sync, then build and run on a device or emulator
```

`sync` runs the web build first on purpose. Copying a stale `dist/` into a
native project and then debugging the resulting behaviour is a bad afternoon.

### An APK without a toolchain

Every push builds a debug APK: **Actions → Native apps → the run → Artifacts →
`g7m-android-debug`**. Unzip it, put the `.apk` on an Android phone and allow
the installer to install from that source. It is a debug build — no signing,
no Play Store — which is exactly right for trying it out.

Building one by hand:

```bash
pnpm --filter @g7m/mobile sync
cd apps/mobile/android && ./gradlew assembleDebug
# app/build/outputs/apk/debug/app-debug.apk
```

### An iPhone build, from a computer that is not a Mac

Every push builds the iOS app too: **Actions → Native apps → the run →
Artifacts → `g7m-ios-unsigned`**. Inside is `g7m-unsigned.ipa` — the whole
app, built for a real device, with no signature on it. Signing is what ties an
app to a phone, and an installer does it on the way in, with the Apple ID of
whoever is installing. No Mac and no Apple Developer account
([ADR-0075](../../DECISIONS.md#adr-0075--an-iphone-build-from-a-windows-machine)).

**With a free Apple ID (Sideloadly, from Windows):**

1. Install [Sideloadly](https://sideloadly.io) and Apple's **Apple Devices**
   app (or iTunes from apple.com — not the Microsoft Store version).
2. Plug the iPhone in with a cable and tap **Trust** on the phone.
3. Drag `g7m-unsigned.ipa` into Sideloadly, put in the Apple ID, press Start.
4. On the phone: **Settings → General → VPN & Device Management** → trust the
   certificate, then open g7m.

What a free Apple ID costs you: the app **stops opening after seven days**
(run Sideloadly again to refresh it, which keeps the data), three sideloaded
apps at once, and a cable each time. [AltStore](https://altstore.io) does the
same thing and can refresh over Wi-Fi, which is worth it if the seven days
becomes annoying.

**With the Apple Developer Program ($99/year), TestFlight:** builds install
without a cable, last 90 days, and update themselves. It needs an App Store
Connect record, a distribution certificate and an API key in the repository's
secrets; the workflow to archive, sign and upload is a small addition to
`native.yml` and is worth adding the day that account exists.

**On a Mac**, none of this applies:

```bash
pnpm --filter @g7m/mobile sync
pnpm --filter @g7m/mobile open:ios   # then set the team in Signing & Capabilities, and Run
```

Either way the Home Screen web app
([ADR-0026](../../DECISIONS.md#adr-0026--ios-ships-as-a-home-screen-web-app-and-the-spike-resolves-to-keep-powersync))
stays exactly where it is, and stays the version that never expires.

**iOS 17 or newer.** The offline database is WebKit's OPFS, which the spike
behind ADR-0026 tested from iOS 17 up. An older phone would open the app onto
a database it cannot create.

## Signing in

Google sign-in opens the system browser and comes back to `g7m://auth-callback`,
which both native projects register. That URL has to be in Supabase's redirect
allow-list (`supabase/config.toml` → `additional_redirect_urls`, and the same
list in the dashboard) or Supabase quietly substitutes `site_url` and the app
never hears back. Email and password need none of this.

## The artwork

`assets/` holds five SVGs — the icon, its Android foreground and background,
and a splash screen for each theme. `pnpm --filter @g7m/mobile assets`
rasterises them into both native projects and into `apps/web/public`, so the
Home Screen icon and the app icon are the same mark. Everything it writes is
committed.

## What is and is not committed

`ios/` and `android/` **are** committed — they hold real configuration
(signing, permissions, plugin registration, icons). The web bundle Capacitor
copies into them is generated output and is gitignored.

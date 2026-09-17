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

### iOS

CI compiles the iOS app for the simulator on every push, which catches a
broken `Info.plist` or a plugin that will not link. It cannot hand out an
install: that needs an Apple Developer account, a certificate and a
provisioning profile. On a Mac:

```bash
pnpm --filter @g7m/mobile sync
pnpm --filter @g7m/mobile open:ios   # then set the team in Signing & Capabilities, and Run
```

Until then, iOS runs the same app from the Home Screen web app
([ADR-0026](../../DECISIONS.md#adr-0026--ios-ships-as-a-home-screen-web-app-and-the-spike-resolves-to-keep-powersync)).

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

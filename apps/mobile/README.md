# @g7m/mobile

Capacitor 7 shell for iOS and Android. Deliberately thin: native configuration,
icons, splash screens and plugin registration. No application code.

## Prerequisites

| Target  | Needs |
| ------- | ----- |
| Android | Android Studio, JDK 17+, Android SDK 34+ |
| iOS     | macOS, Xcode 15+, CocoaPods. **Cannot be built on Windows.** |

## Commands

```bash
pnpm --filter @g7m/mobile sync          # build apps/web, then copy + update native projects
pnpm --filter @g7m/mobile open:android  # open in Android Studio
pnpm --filter @g7m/mobile open:ios      # open in Xcode (macOS only)
```

`sync` runs the web build first on purpose. Copying a stale `dist/` into a
native project and then debugging the resulting behaviour is a bad afternoon.

## What is and is not committed

`ios/` and `android/` **are** committed — they hold real configuration
(signing, permissions, plugin registration). The web bundle Capacitor copies
into them is generated output and is gitignored.

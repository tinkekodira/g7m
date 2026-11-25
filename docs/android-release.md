# Releasing the Android app

How a version of g7m gets from this repository to Google Play. ADR-0191.

The short version: bump the version, push a `v` tag, download the bundle the
**Release builds** workflow makes, upload it in the Play Console.

## Once: the upload key

Play holds the key that signs the app on people's phones (Play App Signing).
You sign each upload with your own **upload key**, which only proves the upload
came from you. If you lose it, Play support can reset it, but that takes days,
so keep two copies.

1. Make the key. In Git Bash, with Android Studio's Java (any JDK 17+ works):

   ```bash
   "/c/Program Files/Android/Android Studio/jbr/bin/keytool" -genkeypair \
     -keystore ~/g7m-upload.jks -alias upload \
     -keyalg RSA -keysize 4096 -validity 10000
   ```

   It asks for a password (use a long one; one password for the store and the
   key keeps it simple), then a name — any name will do, it is never shown to
   users.

   Keep `g7m-upload.jks` **outside this repository**. `*.jks` is ignored by Git
   as a safety net, not as a place to keep it.

2. Back it up: the `.jks` file and the password, in a password manager or on a
   second drive.

3. Give it to GitHub. Repository **Settings → Secrets and variables →
   Actions → New repository secret**, four times:

   | Secret | Value |
   | --- | --- |
   | `ANDROID_UPLOAD_KEYSTORE_BASE64` | output of `base64 -w0 ~/g7m-upload.jks` |
   | `ANDROID_UPLOAD_STORE_PASSWORD` | the password |
   | `ANDROID_UPLOAD_KEY_ALIAS` | `upload` |
   | `ANDROID_UPLOAD_KEY_PASSWORD` | the password (same one, unless you chose two) |

   Without these secrets a tag still builds the debug APK, and the run shows a
   warning saying why there is no Play bundle.

## Every release

1. **Bump the version** in `apps/web/package.json` — the only place. The app
   shows it, and Android reads it: `versionName` is the version, `versionCode`
   is `major × 1,000,000 + minor × 1,000 + patch` (`0.1.0` → 1000, `1.2.3` →
   1002003). Play refuses a `versionCode` it has seen, so every upload needs a
   higher version.
2. **Merge, then tag** the merge commit on `main` with the same version:

   ```bash
   git switch main && git pull
   git tag v0.2.0 && git push origin v0.2.0
   ```

3. **Download the bundle.** Actions → **Release builds** → the run for the tag
   → artifact `g7m-android-play-bundle` (`app-release.aab`). The run summary
   names the version.
4. **Upload it** in the Play Console: Test and release → a track (internal
   testing first) → Create new release → upload the `.aab`.

The same run also has `g7m-android-debug`, an APK you can install straight on
a phone to try the exact build.

## Building a signed bundle on your computer

Put the four values in `~/.gradle/gradle.properties` (your user folder, never
the repository's):

```properties
G7M_UPLOAD_STORE_FILE=C:/Users/you/g7m-upload.jks
G7M_UPLOAD_STORE_PASSWORD=...
G7M_UPLOAD_KEY_ALIAS=upload
G7M_UPLOAD_KEY_PASSWORD=...
```

then `pnpm mobile:sync` and, in `apps/mobile/android`, `./gradlew bundleRelease`.
Without them `bundleRelease` still works and makes an unsigned bundle, which
Play refuses.

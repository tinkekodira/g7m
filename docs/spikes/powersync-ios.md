# Spike — PowerSync SQLite persistence inside Capacitor iOS

**Status:** ⚠️ Partially run. The iOS half is **not** done and **blocks Phase 2**.
**Branch:** `spike/powersync-ios` (disposable — delete it whichever way this goes)
**Decision record:** [ADR-0014](../../DECISIONS.md#adr-0014--the-powersync-ios-spike-is-split-and-half-of-it-is-deferred)

---

## The risk being tested

PowerSync's Web/JS SDK stores its SQLite database in **OPFS** (the Origin
Private File System). OPFS support inside the iOS **WKWebView** has historically
been quirky — the API is present, but the synchronous access handles that
wa-sqlite depends on have had version-specific gaps, and storage has been
evicted in ways Safari proper does not do.

If OPFS-backed SQLite does not work reliably inside a real Capacitor iOS build,
then the entire offline architecture — which is a hard requirement, not a
nice-to-have — rests on something that does not work. Better to find out now
than after Phase 4.

**The fallback**, if this fails: `@capacitor-community/sqlite` on native, with a
hand-rolled sync queue. That is significantly more code that we own and maintain
forever, so it is not the default choice — but it is a known, working path.

## What counts as a pass

All four, on a **physical iPhone** (iOS 17+), in a **release-configuration
build**, not the simulator and not `cap run` with live reload:

1. **Open** — a PowerSync SQLite database opens without error.
2. **Write** — at least 1,000 rows insert in a transaction, and read back
   correctly.
3. **Persist across app restart** — force-quit the app from the app switcher,
   relaunch, and the rows are still there.
4. **Persist under pressure** — background the app for 10+ minutes with other
   apps running, return, and the rows are still there.

Anything less than all four is a fail, and a fail means we take the fallback.

Test on the simulator **as well**, but never *instead* — the simulator uses the
host filesystem and does not reproduce iOS storage eviction behaviour, which is
precisely the failure mode we are worried about.

---

## Why only half of this has been run

The development machine is Windows 11. Building for iOS requires macOS and
Xcode; there is no way around that. So the spike was split
([ADR-0014](../../DECISIONS.md#adr-0014--the-powersync-ios-spike-is-split-and-half-of-it-is-deferred)):

| Half | Where it runs | State |
| --- | --- | --- |
| Harness correctness, OPFS in a Chromium engine | Windows | Run — see [Results](#results) |
| WebView2 (Tauri, Windows) | Windows, needs Rust installed | Not run |
| **WKWebView on a physical iPhone** | **macOS + iPhone** | **Not run — this is the gate** |

Phases 0 and 1 do not depend on the answer: the Postgres schema, the RLS
policies and the seed data are identical whether sync goes through PowerSync or
a hand-rolled queue. **Phase 2 does depend on it**, entirely.

---

## Running the iOS half

On a Mac, with the repository cloned and an iPhone connected:

```bash
git switch spike/powersync-ios
pnpm install
pnpm --filter @g7m/mobile sync
pnpm --filter @g7m/mobile open:ios
```

Then, in Xcode:

1. Select your physical iPhone as the destination — **not** a simulator.
2. **Product → Scheme → Edit Scheme → Run → Build Configuration: Release.**
   Debug builds get different WebView and storage behaviour; test what ships.
3. Set your signing team under Signing & Capabilities.
4. Run. The app opens straight onto the spike harness.
5. Work through the four checks on screen, in order. The harness reports each
   one as a pass or fail with the underlying error where there is one.
6. For check 3, force-quit from the app switcher — **backgrounding is not
   enough**, and neither is Xcode's stop button.
7. For check 4, background it for at least 10 minutes with several heavy apps
   open, then return.

Note the iOS version and device model with the result. This behaviour has been
version-specific in the past, so "it worked" without a version number is not a
useful finding.

## Recording the outcome

1. Write the result into this file under [Results](#results) — device, iOS
   version, each of the four checks, and any errors verbatim.
2. Add an ADR to `DECISIONS.md` recording the finding and what Phase 2 does
   about it.
3. **Delete the branch**, whichever way it went. The finding is the deliverable;
   the code is not. `git push origin --delete spike/powersync-ios`.

---

## Results

### Chromium engine (Windows) — harness verification only

Run to confirm the harness itself is correct, not as evidence about iOS. OPFS in
Chromium has never been in doubt; a pass here means the test is measuring what
it claims to measure and will produce a trustworthy answer on the device.

> _Filled in on the spike branch._

### WKWebView, physical iPhone

> **Not run.** Blocks Phase 2.

| Check | Result | Notes |
| --- | --- | --- |
| 1. Database opens | — | |
| 2. 1,000-row write and read-back | — | |
| 3. Survives force-quit | — | |
| 4. Survives 10 min backgrounded | — | |

**Device:**
**iOS version:**
**PowerSync SDK version:**
**Verdict:**

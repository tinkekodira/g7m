# Spike — PowerSync SQLite persistence inside Capacitor iOS

**Status:** ⚠️ Harness built and verified. The iOS half is **not** done and **blocks Phase 2**.
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

**The fallback, revised.** The brief assumed a binary outcome: PowerSync works,
or we drop to `@capacitor-community/sqlite` with a hand-rolled sync queue.
Building the harness showed that is not the shape of the problem. PowerSync's
web SDK does not hard-depend on OPFS — it ships **four** virtual filesystems,
one of which is backed by IndexedDB:

| VFS | Storage | Notes |
| --- | --- | --- |
| `OPFSCoopSyncVFS` | OPFS | PowerSync's default for Safari-family engines |
| `AccessHandlePoolVFS` | OPFS | Pre-opens sync access handles |
| `OPFSWriteAheadVFS` | OPFS | Concurrent readers; newest, least tested on iOS |
| `IDBBatchAtomicVFS` | **IndexedDB** | No OPFS involved at all |

So the decision tree has three outcomes, not two:

1. **Any OPFS backend passes** → ship it, done.
2. **Only `IDBBatchAtomicVFS` passes** → still PowerSync, one config line
   different on iOS. Slower, but we keep sync rules, conflict handling and the
   whole client. This is a *much* better outcome than the brief anticipated.
3. **Nothing passes** → then, and only then, `@capacitor-community/sqlite` with
   a hand-rolled sync queue.

The harness probes all four independently, in separate database files, so one
failing backend cannot mask another passing.

## What counts as a pass

**At least one of the four VFS backends** must clear all of the following on a
**physical iPhone** (iOS 17+), in a **release-configuration build** — not the
simulator, and not `cap run` with live reload:

1. **Open** — a PowerSync SQLite database opens without error.
2. **Write** — at least 1,000 rows insert in a transaction, and read back
   correctly.
3. **Persist across app restart** — force-quit the app from the app switcher,
   relaunch, and the rows are still there.
4. **Persist under pressure** — background the app for 10+ minutes with other
   apps running, return, and the rows are still there.

If no backend clears all four, we take outcome 3 above. Record *every*
backend's result, not just the first one that passes — knowing that, say, OPFS
fails but IndexedDB works is the finding that matters.

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

**Run 2026-09-05. All four backends pass. ✅**

This is *not* evidence about iOS — OPFS in Chromium has never been in doubt.
What it establishes is that the harness is correct and will produce a
trustworthy answer when someone runs it on a device.

Driven headlessly through Playwright: load, run the probe, reload the page, run
it again. The persistence check correctly reads `pending` on the first run and
`pass` on the second, which is the behaviour that makes the force-quit test on
iOS meaningful.

| VFS | Opens | Writes 1,000 | Persists across reload | Open | Write |
| --- | --- | --- | --- | --- | --- |
| `OPFSCoopSyncVFS` | ✅ | ✅ | ✅ | 71–99 ms | 57–70 ms |
| `AccessHandlePoolVFS` | ✅ | ✅ | ✅ | 55–77 ms | 58–71 ms |
| `OPFSWriteAheadVFS` | ✅ | ✅ | ✅ | 119–161 ms | 69–79 ms |
| `IDBBatchAtomicVFS` | ✅ | ✅ | ✅ | 80–135 ms | 63–77 ms |

Environment: OPFS API present, Web Workers yes, Shared Workers yes,
SharedArrayBuffer **no**, `crossOriginIsolated` **no**, quota 4096 MB.

Two things worth carrying to the device run:

- **No `SharedArrayBuffer` and no cross-origin isolation was needed.** Worth
  knowing, because the usual reason wa-sqlite needs COOP/COEP headers is
  `SharedArrayBuffer`, and setting those headers inside a Capacitor WebView is
  awkward. These backends did not need them.
- **`navigator.storage.persisted()` returned `false` — the data is evictable.**
  On iOS this matters much more than on desktop: Safari evicts unused origin
  storage after roughly seven days of no use. Call `navigator.storage.persist()`
  during the device run and record whether iOS grants it. If it does not, a user
  returning after a two-week holiday could find an empty local database, which
  is a Phase 2 design problem regardless of which VFS wins.

### WebView2 (Windows, Tauri) — real native shell

**Run 2026-09-05 on a real installed build. All four backends pass. 12/12. ✅**

Built by CI on the `spike/powersync-ios` branch (`workflow_dispatch` on
`release.yml`), installed from the NSIS installer, and run twice with the
application **fully closed and relaunched** between runs — so check 3 is a
genuine survival-of-process-death result, not a page reload.

| VFS | Opens | Writes 1,000 | Persists across relaunch | Open | Write |
| --- | --- | --- | --- | --- | --- |
| `OPFSCoopSyncVFS` | ✅ | ✅ | ✅ 1,000 → 2,000 | 113–142 ms | 31–39 ms |
| `AccessHandlePoolVFS` | ✅ | ✅ | ✅ 1,000 → 2,000 | **74–113 ms** | 34–39 ms |
| `OPFSWriteAheadVFS` | ✅ | ✅ | ✅ 1,000 → 2,000 | 146–147 ms | **27–30 ms** |
| `IDBBatchAtomicVFS` | ✅ | ✅ | ✅ 1,000 → 2,000 | 99–139 ms | 64–68 ms |

Environment: `Chrome/152 … Edg/152`, OPFS present, Web Workers **and** Shared
Workers available, **no** `SharedArrayBuffer`, **not** `crossOriginIsolated`,
quota **10,243 MB**.

Three things carry forward:

- **No COOP/COEP headers were needed.** Confirmed on a second engine. Setting
  cross-origin isolation headers inside a native shell is awkward, and it turns
  out we never have to.
- **`navigator.storage.persisted()` is `false` here too** — the database is
  evictable even on desktop, with a 10 GB quota. Two engines now agree. Phase 2
  must call `navigator.storage.persist()` and design for it being refused.
- **IndexedDB is roughly twice as slow to write** (64–68 ms vs 27–39 ms for the
  OPFS backends) but entirely functional. That is the price of the fallback, and
  it is affordable.

### Android WebView

> **Not run, and not runnable.** The owner has no Android device. Noted here so
> nobody goes looking for a result that was never possible to obtain.

### WKWebView, physical iPhone

### WKWebView, physical iPhone

> **Not run.** Blocks Phase 2.

Fill in one row per backend. The harness prints all four.

| VFS | Opens | Writes 1,000 | Survives force-quit | Survives 10 min backgrounded |
| --- | --- | --- | --- | --- |
| `OPFSCoopSyncVFS` | — | — | — | — |
| `AccessHandlePoolVFS` | — | — | — | — |
| `OPFSWriteAheadVFS` | — | — | — | — |
| `IDBBatchAtomicVFS` | — | — | — | — |

**Device:**
**iOS version:**
**PowerSync SDK version:** `@powersync/web` 2.3.0, `@journeyapps/wa-sqlite` 2.0.4
**`navigator.storage.persist()` granted:**
**Errors, verbatim:**
**Verdict (outcome 1, 2 or 3 above):**

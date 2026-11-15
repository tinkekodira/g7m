# L11–L13: actual app shots

Seven 1080×1920 PNGs for the final three lines of “You did 10 sets, not 20”.
Every frame leaves the bottom 480 pixels solid `#111111` for captions and
Reels/TikTok controls. Add the storyboard's kinetic text in the video editor.

| Line | Image | Use |
| --- | --- | --- |
| L11 | [L11.png](L11.png) | Your session: **Working sets 10** |
| L11 | [L11b-warmups.png](L11b-warmups.png) | Exercise log: Warm-up 1–4, followed by three bench sets |
| L11 | [L11c-drops.png](L11c-drops.png) | Three incline sets, each followed by two indented drops |
| L12 | [L12.png](L12.png) | Learn → What I have trained, turned to the back |
| L12 | [L12b-training-review.png](L12b-training-review.png) | How it is going: **Your back is behind** and **A lot of chest** |
| L13 | [L13.png](L13.png) | Recap → Muscles trained: front/back bodies and **Chest 100%** |
| L13 | [L13b-logo.png](L13b-logo.png) | Existing app icon, for the final one-second hold |

These are cropped and scaled screenshots of the actual production app running
locally with its existing anatomy models. UI text, calculated values, muscle
colours and body geometry have not been replaced. The untrained back retains
the actual app's resting body colour. The logo uses `apps/web/public/icon-512.png`.
L1–L10 are outside this capture set.

The disposable local account has twelve push-heavy sessions over four weeks and
the featured chest day: four warm-ups, three bench working sets, three incline
working sets with two drops each, and four fly working sets. The capture script
asserts **20 rows, 10 working sets, 4 warm-ups, 6 drops**, and verifies both review
headlines in the rendered app. The history produces 32.5 chest sets per week
against the app's target of 16. The recap percentage attributes primary work;
the body also highlights assisting muscles, following the app's existing logic.

To reproduce, use the repository's installed Node/pnpm dependencies and Chrome,
plus Python with Pillow:

```powershell
# Terminal 1, repository root. Local, in-memory backend; no live account writes.
.\pnpm.cmd dev:fake --preview

# Terminal 2, repository root, once the preview is ready.
.\pnpm.cmd --filter @g7m/e2e exec vite-node capture-video-shots.ts
python scripts/frame-video-shots.py
```

Raw uncropped screenshots, including a front heat-map alternative, and a capture
manifest are saved under `e2e/test-results/video-l11-l13/raw/` (ignored by Git).
The preview uses port 4381 and the isolated backend uses port 54380. Stop this
demo before running the normal browser suite, which uses the same backend port.
With the licensed models absent, the app uses its generated fallback as usual;
the committed exports were captured with the existing local sculpted model.

Validation: production preview build, complete capture run, e2e TypeScript
check, capture-script ESLint/Prettier, visual inspection of every export, and
pixel checks for dimensions and the empty bottom quarter. No app behavior changes.

PowerSync: no sync-rule deployment required.
Database: no migrations; `npx supabase db push` is not required.

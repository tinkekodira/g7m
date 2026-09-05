## What changed

<!-- One paragraph. What does this PR do, and why does it exist? This text
     becomes the squash-commit body and is the permanent record of the feature,
     so write it for someone reading it in six months. -->

## Phase

<!-- Which build phase from the brief (§11) does this belong to? -->

- [ ] Phase 0 — Foundation and de-risking
- [ ] Phase 1 — Data
- [ ] Phase 2 — Offline
- [ ] Phase 3 — Exercise library
- [ ] Phase 4 — Logging
- [ ] Phase 5 — 3D anatomy
- [ ] Phase 6 — Generator
- [ ] Phase 7 — Progress
- [ ] Phase 8 — Desktop polish
- [ ] Phase 9 — Hardening
- [ ] Out of phase (fix / chore / refactor)

## How to test it manually

<!-- Numbered steps someone can follow without reading the diff.
     Include the platform(s) you actually verified on, not the ones you assume
     work. "Tested on web and Android; iOS not verified" is a useful sentence. -->

1.
2.

## Screenshots or recording

<!-- Required for anything visual. A screen recording beats four screenshots
     for interaction work — the logger and the 3D viewer especially. -->

## Checklist

- [ ] `pnpm check` passes locally (lint, typecheck, tests, build)
- [ ] New logic has tests; presentational-only changes do not need them
- [ ] `DECISIONS.md` updated, if a non-obvious technical call was made
- [ ] No secrets added — no API keys, tokens, or `.env` files in the diff
- [ ] Binary assets go through Git LFS (`.glb`, `.mp4`, `.ktx2`, …)
- [ ] Branch is rebased onto `main`, not merged from it
- [ ] Tap targets are at least 48×48px, if this touches the logger

## Anything you deliberately left out

<!-- Known gaps, follow-ups, things that were out of scope. Better written down
     here than rediscovered later. -->

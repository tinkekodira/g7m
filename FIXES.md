# Cosmetic notes — plate calculator rebuild

Nothing here blocks the feature; everything below is a suggestion, not a bug
report. Screenshotted against the fake-backend e2e build (Chromium, Pixel 7
viewport).

## "Available plates" selected/deselected contrast is opacity-only

A deselected plate button drops to `opacity-45` and nothing else changes —
same colour disc, same border, same text colour, just fainter. In a
screenshot it reads clearly enough, but it's the *only* visual signal for a
sighted user (the ARIA `aria-pressed` state covers screen readers). Worth a
look on an actual phone in bright light — if it's too subtle there, a small
check mark or a border-colour change on the selected state would make the
difference more certain without needing much contrast headroom.

## Five-plus plate rows wrap the trailing "on a 20 kg bar" onto its own line

At a heavy weight (five plates a side, e.g. 185 kg), the "Each end" row's
chips fill the card width and "on a 20 kg bar" drops to a second line on its
own. It still reads fine, just worth a glance on a real narrow phone (this
was checked at a Pixel-7-width viewport) to confirm it doesn't look like a
stray orphaned line.

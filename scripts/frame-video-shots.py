"""Frame actual app captures for L11–L13. Requires Pillow; run from repo root."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "e2e/test-results/video-l11-l13/raw"
OUT = ROOT / "docs/video/l11-l13"
OUT.mkdir(parents=True, exist_ok=True)
SIZE = (1080, 1920)
BACKGROUND = "#111111"

# Pixel crops of the actual 1080×1920 screenshots. No UI is redrawn or recoloured.
# Cut away unrelated navigation and controls; preserve the featured content.
SHOTS = [
    ("L11-your-session.png", "L11.png", (40, 200, 1040, 1480)),
    ("L11-exercise-log-warmups.png", "L11b-warmups.png", (40, 200, 1040, 1145)),
    ("L11-exercise-log-drops.png", "L11c-drops.png", (40, 200, 1040, 1205)),
    ("L12-heatmap-back.png", "L12.png", (40, 20, 1040, 1475)),
    ("L12-training-review.png", "L12b-training-review.png", (40, 40, 1040, 865)),
    ("L13-muscles-trained.png", "L13.png", (40, 200, 1040, 1480)),
]

for source, target, crop in SHOTS:
    with Image.open(RAW / source) as original:
        assert original.size == SIZE, (source, original.size)
        content = original.convert("RGB").crop(crop)
    content.thumbnail((960, 1320), Image.Resampling.LANCZOS)
    frame = Image.new("RGB", SIZE, BACKGROUND)
    x = (SIZE[0] - content.width) // 2
    y = 80 + (1320 - content.height) // 2
    frame.paste(content, (x, y))
    # An unobtrusive outline separates the real app panel from the video plate.
    ImageDraw.Draw(frame).rectangle(
        (x - 1, y - 1, x + content.width, y + content.height), outline="#3f454b"
    )
    frame.save(OUT / target, optimize=True)

# Use the shipped app mark unchanged. Its square is part of the existing icon.
with Image.open(ROOT / "apps/web/public/icon-512.png") as source:
    logo = source.convert("RGB").resize((512, 512), Image.Resampling.LANCZOS)
frame = Image.new("RGB", SIZE, BACKGROUND)
frame.paste(logo, (284, 484))
frame.save(OUT / "L13b-logo.png", optimize=True)

# Every editorial frame keeps the bottom quarter completely free for captions.
for path in OUT.glob("*.png"):
    with Image.open(path) as image:
        assert image.size == SIZE
        assert image.crop((0, 1440, 1080, 1920)).getextrema() == ((17, 17),) * 3
print(f"Exported {len(SHOTS) + 1} frames to {OUT}")

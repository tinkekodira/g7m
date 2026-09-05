/**
 * Generates the app icons from the design tokens.
 *
 * A script rather than committed mystery binaries: the icons are derived from
 * `--bg-base` and `--accent`, so changing the palette regenerates them, and
 * anyone can see exactly what the mark is without opening an image editor.
 *
 * No image library — PNG is a container around zlib-compressed scanlines, and
 * a flat-colour glyph needs about sixty lines of arithmetic. Adding a
 * dependency for that would be a poor trade (Brief §0.3).
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT_DIR = fileURLToPath(new URL('../apps/web/public/', import.meta.url));

/** From packages/ui/src/tokens.css. */
const BACKGROUND = [0x1f, 0x1e, 0x1d];
const ACCENT = [0xd9, 0x77, 0x57];

// --- PNG encoding ----------------------------------------------------------

const CRC_TABLE = Int32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([head, body, crc]);
}

/** `pixels` is RGB triples, row-major. */
function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  // 10..12 stay zero: deflate, adaptive filtering, no interlace.

  // One filter byte (0 = None) per scanline, then the raw row.
  const stride = size * 3;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- The mark --------------------------------------------------------------

/** Rounded rectangle hit test, in 0..1 coordinates. */
function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/**
 * A dumbbell, in 0..1 coordinates.
 *
 * Every part sits inside the central circle of radius 0.4 — the safe zone for
 * a `maskable` icon — so Android can crop it to a circle, a squircle or a
 * rounded square without clipping the mark. The furthest corner is at 0.313.
 */
function isGlyph(x, y) {
  return (
    // Bar
    inRoundedRect(x, y, 0.36, 0.455, 0.64, 0.545, 0.02) ||
    // Plates
    inRoundedRect(x, y, 0.26, 0.34, 0.36, 0.66, 0.03) ||
    inRoundedRect(x, y, 0.64, 0.34, 0.74, 0.66, 0.03) ||
    // Collars
    inRoundedRect(x, y, 0.2, 0.41, 0.26, 0.59, 0.02) ||
    inRoundedRect(x, y, 0.74, 0.41, 0.8, 0.59, 0.02)
  );
}

/** 3x3 supersampling, so the curves are not staircases at 192px. */
function render(size) {
  const pixels = Buffer.alloc(size * size * 3);
  const samples = 3;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let hits = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const x = (px + (sx + 0.5) / samples) / size;
          const y = (py + (sy + 0.5) / samples) / size;
          if (isGlyph(x, y)) hits += 1;
        }
      }
      const a = hits / (samples * samples);
      const offset = (py * size + px) * 3;
      for (let c = 0; c < 3; c += 1) {
        pixels[offset + c] = Math.round(BACKGROUND[c] * (1 - a) + ACCENT[c] * a);
      }
    }
  }
  return pixels;
}

mkdirSync(OUT_DIR, { recursive: true });

for (const size of [180, 192, 512]) {
  const file = `icon-${size}.png`;
  const png = encodePng(size, render(size));
  writeFileSync(new URL(file, `file://${OUT_DIR.replaceAll('\\', '/')}`), png);
  console.log(`  ${file.padEnd(16)} ${String(png.length).padStart(6)} bytes`);
}
console.log(`\nWritten to ${OUT_DIR}`);

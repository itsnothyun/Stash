// Renders installer/src-tauri/dmg/background.png: the light, warm surface of
// the app with a soft indigo glow behind where "Stash Setup" sits.
// Run with `node installer/scripts/make-dmg-background.mjs`.

import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const W = 660;
const H = 400;
const surface = [251, 250, 249]; // --surface: 30 9% 98%
const brand = [91, 85, 224]; // --brand: 243 70% 58%
const dot = [228, 227, 232]; // --border, softened

const glow = { x: 330, y: 200, r: 210, strength: 0.16 };

const pixels = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) {
  const row = y * (W * 4 + 1);
  pixels[row] = 0; // filter: none
  for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - glow.x, y - glow.y) / glow.r;
    // Smooth falloff, zero outside the radius.
    const g = d < 1 ? glow.strength * (1 - d * d) ** 2 : 0;
    let c = surface.map((s, i) => s + (brand[i] - s) * g);
    // A faint dot grid, the same texture as the app's empty canvas.
    if (x % 22 === 11 && y % 22 === 11 && g < 0.04) c = dot;
    const o = row + 1 + x * 4;
    pixels[o] = Math.round(c[0]);
    pixels[o + 1] = Math.round(c[1]);
    pixels[o + 2] = Math.round(c[2]);
    pixels[o + 3] = 255;
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(pixels, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "../src-tauri/dmg/background.png");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);

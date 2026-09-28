/**
 * Mesure locale des variantes Sharp (sans Supabase).
 * Usage : node scripts/measure-catechumene-photos.mjs
 */

import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, ".photo-measure-out");
mkdirSync(outDir, { recursive: true });

const WEBP_QUALITY = 80;
const SMALL = { width: 320, height: 320 };
const LARGE = { width: 640, height: 854 };
const MAX_OUTPUT_EDGE = 1280;

async function encodeVariant(input, target) {
  const { data: resized, info: resizedInfo } = await sharp(input)
    .rotate()
    .resize({
      width: target.width,
      height: target.height,
      fit: "outside",
      withoutEnlargement: true
    })
    .toBuffer({ resolveWithObject: true });

  let pipeline = sharp(resized);
  if (
    resizedInfo.width > MAX_OUTPUT_EDGE ||
    resizedInfo.height > MAX_OUTPUT_EDGE
  ) {
    pipeline = pipeline.resize({
      width: MAX_OUTPUT_EDGE,
      height: MAX_OUTPUT_EDGE,
      fit: "inside",
      withoutEnlargement: true
    });
  }

  const { data, info } = await pipeline
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, width: info.width, height: info.height, bytes: data.byteLength };
}

async function makeSample(name, width, height, opts = {}) {
  const { channels = 3 } = opts;
  // Image synthétique avec dégradé + bruit léger pour un poids réaliste
  const buf = await sharp({
    create: {
      width,
      height,
      channels,
      background: { r: 90, g: 120, b: 160 }
    }
  })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Ajoute un overlay texte-like via noise pattern pour éviter JPEG trop compressible
  const noisy = await sharp(buf)
    .composite([
      {
        input: await sharp({
          create: {
            width: Math.min(width, 400),
            height: Math.min(height, 400),
            channels: 3,
            background: { r: 200, g: 100, b: 80 }
          }
        })
          .png()
          .toBuffer(),
        gravity: "centre"
      }
    ])
    .jpeg({ quality: 88 })
    .toBuffer();

  return { name, buffer: noisy, width, height };
}

async function measure(sample) {
  const meta = await sharp(sample.buffer).metadata();
  const small = await encodeVariant(sample.buffer, SMALL);
  const large = await encodeVariant(sample.buffer, LARGE);

  writeFileSync(join(outDir, `${sample.name}-small.webp`), small.buffer);
  writeFileSync(join(outDir, `${sample.name}-large.webp`), large.buffer);

  return {
    name: sample.name,
    source: {
      width: meta.width,
      height: meta.height,
      bytes: sample.buffer.byteLength
    },
    small: {
      width: small.width,
      height: small.height,
      bytes: small.bytes,
      kb: +(small.bytes / 1024).toFixed(1)
    },
    large: {
      width: large.width,
      height: large.height,
      bytes: large.bytes,
      kb: +(large.bytes / 1024).toFixed(1)
    }
  };
}

const samples = await Promise.all([
  makeSample("portrait-phone", 1200, 1600),
  makeSample("landscape-photo", 1600, 1200),
  makeSample("square", 1000, 1000),
  makeSample("small-source", 200, 250),
  makeSample("panorama-extreme", 4000, 400)
]);

const results = [];
for (const s of samples) {
  results.push(await measure(s));
}

console.log(JSON.stringify(results, null, 2));
console.log(`\nFichiers écrits dans ${outDir}`);

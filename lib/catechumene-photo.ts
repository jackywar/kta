import sharp, { type Metadata } from "sharp";

/**
 * Génération des variantes WebP catéchumène (serveur uniquement).
 *
 * - small : remplit un carré 320×320 (fiche 160 CSS × DPR2) via fit "outside"
 * - large : remplit ~640×854 (tuile 3:4 pire cas × DPR2 + marge) via fit "outside"
 * - jamais de crop destructif (pas de fit "cover")
 * - withoutEnlargement : sources trop petites non agrandies
 * - plafonnage du grand côté pour éviter les panoramiques aberrants
 */

export const CATECHUMENE_PHOTO_WEBP_QUALITY = 80;

export const CATECHUMENE_PHOTO_SMALL_TARGET = {
  width: 320,
  height: 320
} as const;

export const CATECHUMENE_PHOTO_LARGE_TARGET = {
  width: 640,
  height: 854
} as const;

/** Au-delà, on réduit en "inside" sans crop (ratios extrêmes). */
export const CATECHUMENE_PHOTO_MAX_OUTPUT_EDGE = 1280;

export type GeneratedCatechumenePhotoVariant = {
  buffer: Buffer;
  width: number;
  height: number;
  bytes: number;
};

export type GeneratedCatechumenePhotos = {
  source: { width: number; height: number };
  small: GeneratedCatechumenePhotoVariant;
  large: GeneratedCatechumenePhotoVariant;
};

async function encodeWebpVariant(
  input: Buffer,
  target: { width: number; height: number }
): Promise<GeneratedCatechumenePhotoVariant> {
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
    resizedInfo.width > CATECHUMENE_PHOTO_MAX_OUTPUT_EDGE ||
    resizedInfo.height > CATECHUMENE_PHOTO_MAX_OUTPUT_EDGE
  ) {
    pipeline = pipeline.resize({
      width: CATECHUMENE_PHOTO_MAX_OUTPUT_EDGE,
      height: CATECHUMENE_PHOTO_MAX_OUTPUT_EDGE,
      fit: "inside",
      withoutEnlargement: true
    });
  }

  const { data, info } = await pipeline
    .webp({ quality: CATECHUMENE_PHOTO_WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    bytes: data.byteLength
  };
}

/**
 * Décode le buffer, vérifie que Sharp peut le lire, produit small + large.
 * Lève une Error si le fichier n'est pas une image décodable.
 */
export async function generateCatechumenePhotoVariants(
  input: Buffer
): Promise<GeneratedCatechumenePhotos> {
  let sourceMeta: Metadata;
  try {
    sourceMeta = await sharp(input).rotate().metadata();
  } catch {
    throw new Error("Image illisible ou format non supporté.");
  }

  if (!sourceMeta.width || !sourceMeta.height) {
    throw new Error("Image sans dimensions exploitables.");
  }

  const [small, large] = await Promise.all([
    encodeWebpVariant(input, CATECHUMENE_PHOTO_SMALL_TARGET),
    encodeWebpVariant(input, CATECHUMENE_PHOTO_LARGE_TARGET)
  ]);

  return {
    source: { width: sourceMeta.width, height: sourceMeta.height },
    small,
    large
  };
}

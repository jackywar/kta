/**
 * Migration manuelle : photo.jpg legacy → small.webp + large.webp versionnés.
 *
 * Usage (depuis le dossier kta/) :
 *   node --env-file=.env.local scripts/migrate-catechumene-photos.mjs
 *
 * Ou avec les variables déjà exportées :
 *   node scripts/migrate-catechumene-photos.mjs
 *
 * Idempotent : ignore les photos déjà migrées (chemin sans /photo.jpg).
 * Ne lance pas automatiquement en production.
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { randomUUID } from "node:crypto";

const BUCKET = "catechumene-photos";
const WEBP_QUALITY = 80;
const SMALL = { width: 320, height: 320 };
const LARGE = { width: 640, height: 854 };
const MAX_OUTPUT_EDGE = 1280;
const CACHE_CONTROL = "31536000";

function isLegacy(path) {
  return /(^|\/)photo\.jpg$/i.test(path);
}

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

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    console.error(
      "Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY."
    );
    console.error(
      "Exemple : node --env-file=.env.local scripts/migrate-catechumene-photos.mjs"
    );
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: rows, error } = await admin
    .from("catechumenes")
    .select("id, photo_path")
    .not("photo_path", "is", null);

  if (error) {
    console.error("Erreur lecture catechumenes:", error.message);
    process.exit(1);
  }

  const legacy = (rows ?? []).filter(
    (r) => r.photo_path && isLegacy(r.photo_path)
  );
  const already = (rows ?? []).filter(
    (r) => r.photo_path && !isLegacy(r.photo_path)
  );

  console.log(`Photos en base : ${rows?.length ?? 0}`);
  console.log(`Déjà migrées   : ${already.length}`);
  console.log(`À migrer       : ${legacy.length}`);
  console.log("");

  let ok = 0;
  let fail = 0;

  for (const row of legacy) {
    const legacyPath = row.photo_path;
    process.stdout.write(`[${row.id}] ${legacyPath} … `);

    try {
      const { data: blob, error: dlError } = await admin.storage
        .from(BUCKET)
        .download(legacyPath);

      if (dlError || !blob) {
        throw new Error(dlError?.message ?? "download failed");
      }

      const input = Buffer.from(await blob.arrayBuffer());
      const small = await encodeVariant(input, SMALL);
      const large = await encodeVariant(input, LARGE);

      const versionId = randomUUID();
      const prefix = `${row.id}/${versionId}`;
      const smallPath = `${prefix}/small.webp`;
      const largePath = `${prefix}/large.webp`;
      const uploaded = [];

      try {
        const upSmall = await admin.storage.from(BUCKET).upload(smallPath, small.buffer, {
          contentType: "image/webp",
          upsert: false,
          cacheControl: CACHE_CONTROL
        });
        if (upSmall.error) throw new Error(upSmall.error.message);
        uploaded.push(smallPath);

        const upLarge = await admin.storage.from(BUCKET).upload(largePath, large.buffer, {
          contentType: "image/webp",
          upsert: false,
          cacheControl: CACHE_CONTROL
        });
        if (upLarge.error) throw new Error(upLarge.error.message);
        uploaded.push(largePath);

        const { error: updError } = await admin
          .from("catechumenes")
          .update({ photo_path: prefix })
          .eq("id", row.id);

        if (updError) {
          await admin.storage.from(BUCKET).remove(uploaded);
          throw new Error(updError.message);
        }

        const { error: rmError } = await admin.storage
          .from(BUCKET)
          .remove([legacyPath]);
        if (rmError) {
          console.warn(
            `\n  ⚠ Variantes OK mais suppression legacy échouée: ${rmError.message}`
          );
        }

        console.log(
          `OK → ${prefix} (small ${small.width}x${small.height} ${Math.round(small.bytes / 1024)}Ko, large ${large.width}x${large.height} ${Math.round(large.bytes / 1024)}Ko)`
        );
        ok += 1;
      } catch (inner) {
        if (uploaded.length) {
          await admin.storage.from(BUCKET).remove(uploaded);
        }
        throw inner;
      }
    } catch (err) {
      fail += 1;
      console.log(`ÉCHEC: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log("");
  console.log(`Terminé. Succès: ${ok}, Échecs: ${fail}, Ignorées: ${already.length}`);
  process.exit(fail > 0 ? 1 : 0);
}

main();

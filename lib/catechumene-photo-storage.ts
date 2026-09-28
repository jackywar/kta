import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CATECHUMENE_PHOTOS_BUCKET,
  CATECHUMENE_PHOTO_CACHE_CONTROL,
  catechumenePhotoObjectPaths,
  catechumenePhotoPathsToRemove,
  catechumenePhotoVersionPrefix
} from "@/lib/storage";
import {
  generateCatechumenePhotoVariants,
  type GeneratedCatechumenePhotos
} from "@/lib/catechumene-photo";

export type UploadCatechumenePhotosResult = {
  photo_path: string;
  generated: GeneratedCatechumenePhotos;
};

async function ensurePhotosBucket(admin: SupabaseClient): Promise<void> {
  const { data: buckets, error: listError } =
    await admin.storage.listBuckets();
  if (listError) {
    throw new Error(listError.message ?? "Impossible de lister les buckets.");
  }
  if (buckets?.some((b) => b.name === CATECHUMENE_PHOTOS_BUCKET)) {
    return;
  }
  const { error: createError } = await admin.storage.createBucket(
    CATECHUMENE_PHOTOS_BUCKET,
    { public: true }
  );
  if (createError && !/already exists/i.test(createError.message ?? "")) {
    throw new Error(
      createError.message ??
        "Bucket storage manquant. Créez le bucket « catechumene-photos » (public) dans Supabase."
    );
  }
}

/**
 * Génère small.webp + large.webp, les uploade sous une nouvelle version,
 * bascule photo_path, puis nettoie l'ancienne version.
 * L'original n'est jamais stocké.
 */
export async function uploadCatechumenePhotoVariants(
  admin: SupabaseClient,
  catechumeneId: string,
  previousPhotoPath: string | null,
  input: Buffer
): Promise<UploadCatechumenePhotosResult> {
  const generated = await generateCatechumenePhotoVariants(input);
  const versionId = crypto.randomUUID();
  const versionPrefix = catechumenePhotoVersionPrefix(catechumeneId, versionId);
  const paths = catechumenePhotoObjectPaths(versionPrefix);

  await ensurePhotosBucket(admin);

  const uploadOpts = {
    contentType: "image/webp" as const,
    upsert: false,
    cacheControl: CATECHUMENE_PHOTO_CACHE_CONTROL
  };

  const uploaded: string[] = [];
  try {
    const smallUp = await admin.storage
      .from(CATECHUMENE_PHOTOS_BUCKET)
      .upload(paths.small, generated.small.buffer, uploadOpts);
    if (smallUp.error) {
      throw new Error(smallUp.error.message ?? "Upload small.webp failed");
    }
    uploaded.push(paths.small);

    const largeUp = await admin.storage
      .from(CATECHUMENE_PHOTOS_BUCKET)
      .upload(paths.large, generated.large.buffer, uploadOpts);
    if (largeUp.error) {
      throw new Error(largeUp.error.message ?? "Upload large.webp failed");
    }
    uploaded.push(paths.large);
  } catch (err) {
    if (uploaded.length > 0) {
      await admin.storage.from(CATECHUMENE_PHOTOS_BUCKET).remove(uploaded);
    }
    throw err;
  }

  const { error: updateError } = await admin
    .from("catechumenes")
    .update({ photo_path: versionPrefix })
    .eq("id", catechumeneId);

  if (updateError) {
    await admin.storage.from(CATECHUMENE_PHOTOS_BUCKET).remove(uploaded);
    throw new Error(updateError.message ?? "Failed to update catechumene");
  }

  if (previousPhotoPath && previousPhotoPath !== versionPrefix) {
    const toRemove = catechumenePhotoPathsToRemove(previousPhotoPath);
    await admin.storage.from(CATECHUMENE_PHOTOS_BUCKET).remove(toRemove);
  }

  return { photo_path: versionPrefix, generated };
}

export async function removeCatechumenePhotoFiles(
  admin: SupabaseClient,
  photoPath: string | null
): Promise<void> {
  if (!photoPath) return;
  const toRemove = catechumenePhotoPathsToRemove(photoPath);
  await admin.storage.from(CATECHUMENE_PHOTOS_BUCKET).remove(toRemove);
}

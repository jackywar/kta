export const CATECHUMENE_PHOTOS_BUCKET = "catechumene-photos";

/** Variantes WebP générées à l'upload (jamais d'original stocké). */
export type CatechumenePhotoVariant = "small" | "large";

export const CATECHUMENE_PHOTO_VARIANTS: readonly CatechumenePhotoVariant[] = [
  "small",
  "large"
] as const;

/** Cache-Control max-age (1 an) : URLs versionnées immuables. */
export const CATECHUMENE_PHOTO_CACHE_CONTROL = "31536000";

/**
 * Préfixe versionné stocké en base : `<catechumeneId>/<versionId>`
 * Les fichiers réels sont `<prefix>/small.webp` et `<prefix>/large.webp`.
 *
 * Ancien format legacy (à migrer) : `<catechumeneId>/photo.jpg`
 */
export function catechumenePhotoVersionPrefix(
  catechumeneId: string,
  versionId: string
): string {
  return `${catechumeneId}/${versionId}`;
}

export function isLegacyCatechumenePhotoPath(photoPath: string): boolean {
  return /(^|\/)photo\.jpg$/i.test(photoPath);
}

/** Chemins Storage des deux variantes pour une version active. */
export function catechumenePhotoObjectPaths(versionPrefix: string): {
  small: string;
  large: string;
} {
  return {
    small: `${versionPrefix}/small.webp`,
    large: `${versionPrefix}/large.webp`
  };
}

/**
 * Résout le chemin objet Storage à servir pour une variante.
 * Les chemins legacy `…/photo.jpg` sont renvoyés tels quels (toute variante).
 */
export function resolveCatechumenePhotoObjectPath(
  photoPath: string,
  variant: CatechumenePhotoVariant
): string {
  if (isLegacyCatechumenePhotoPath(photoPath)) {
    return photoPath;
  }
  return catechumenePhotoObjectPaths(photoPath)[variant];
}

/** URL publique pour afficher la photo (côté client, bucket public). */
export function getCatechumenePhotoUrl(
  photoPath: string | null,
  variant: CatechumenePhotoVariant = "small"
): string | null {
  if (!photoPath) return null;
  const base =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const objectPath = resolveCatechumenePhotoObjectPath(photoPath, variant);
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${CATECHUMENE_PHOTOS_BUCKET}/${objectPath}`;
}

/** Liste des chemins à supprimer pour une référence `photo_path` active. */
export function catechumenePhotoPathsToRemove(photoPath: string): string[] {
  if (isLegacyCatechumenePhotoPath(photoPath)) {
    return [photoPath];
  }
  const { small, large } = catechumenePhotoObjectPaths(photoPath);
  return [small, large];
}

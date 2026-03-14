export const CATECHUMENE_PHOTOS_BUCKET = "catechumene-photos";

export function catechumenePhotoPath(catechumeneId: string): string {
  return `${catechumeneId}/photo.jpg`;
}

/** URL publique pour afficher la photo (côté client, bucket public). */
export function getCatechumenePhotoUrl(photoPath: string | null): string | null {
  if (!photoPath) return null;
  const base =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${CATECHUMENE_PHOTOS_BUCKET}/${photoPath}`;
}

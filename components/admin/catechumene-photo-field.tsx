"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { getCatechumenePhotoUrl } from "@/lib/storage";

const MAX_SIZE_MB = 0.5; // 500 Ko

type Props = {
  catechumeneId: string;
  photoPath: string | null;
  onPhotoChange: () => void;
};

export function CatechumenePhotoField({
  catechumeneId,
  photoPath,
  onPhotoChange
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const photoUrl = getCatechumenePhotoUrl(photoPath);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setPhotoError(null);
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: MAX_SIZE_MB,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      });
      const formData = new FormData();
      formData.set("catechumene_id", catechumeneId);
      formData.set("file", compressed);
      const res = await fetch("/api/admin/catechumenes/photo", {
        method: "POST",
        body: formData
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          (typeof data === "object" &&
            data &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string" &&
            (data as { error: string }).error) ||
          "Erreur lors de l’upload.";
        setPhotoError(msg);
        return;
      }
      onPhotoChange();
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Erreur de compression ou d’upload."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setPhotoError(null);
    setUploading(true);
    try {
      const res = await fetch("/api/admin/catechumenes/photo/remove", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ catechumene_id: catechumeneId })
      });
      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        const msg =
          (typeof data === "object" &&
            data &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string" &&
            (data as { error: string }).error) ||
          "Erreur lors de la suppression.";
        setPhotoError(msg);
        return;
      }
      onPhotoChange();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-zinc-900">Photo</span>
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt="Photo du catéchumène"
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-zinc-400"
              aria-hidden
            >
              —
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {uploading ? "Envoi…" : photoUrl ? "Remplacer" : "Ajouter une photo"}
          </button>
          {photoUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
            >
              Supprimer la photo
            </button>
          ) : null}
        </div>
      </div>
      {photoError ? (
        <p className="text-sm text-red-600">{photoError}</p>
      ) : null}
      <p className="text-xs text-zinc-500">
        Image compressée automatiquement (max. 500 Ko). JPEG, PNG ou WebP.
      </p>
    </div>
  );
}

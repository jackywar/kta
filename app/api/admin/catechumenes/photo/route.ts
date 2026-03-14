import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  CATECHUMENE_PHOTOS_BUCKET,
  catechumenePhotoPath
} from "@/lib/storage";

const MAX_FILE_SIZE_BYTES = 600 * 1024; // 600 Ko max accepté (après compression client ~500 Ko)

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (meError || !me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const catechumeneId = formData.get("catechumene_id");
  const file = formData.get("file");

  if (
    typeof catechumeneId !== "string" ||
    !catechumeneId.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  ) {
    return NextResponse.json(
      { error: "Invalid catechumene_id" },
      { status: 400 }
    );
  }

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing or invalid file" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `Fichier trop volumineux. Compressez à 500 Ko max (reçu ${Math.round(file.size / 1024)} Ko).`
      },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();
  const path = catechumenePhotoPath(catechumeneId);

  const { data: existing } = await admin
    .from("catechumenes")
    .select("id, photo_path")
    .eq("id", catechumeneId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: "Catéchumène introuvable" },
      { status: 404 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  let uploadError: { message?: string } | null = null;
  const upload = () =>
    admin.storage.from(CATECHUMENE_PHOTOS_BUCKET).upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true
    });

  const uploadResult = await upload();
  uploadError = uploadResult.error;

  if (uploadError?.message?.includes("Bucket not found")) {
    const { error: createBucketError } = await admin.storage.createBucket(
      CATECHUMENE_PHOTOS_BUCKET,
      { public: true }
    );
    if (createBucketError) {
      return NextResponse.json(
        {
          error:
            "Bucket storage manquant. Créez le bucket « catechumene-photos » (public) dans Supabase."
        },
        { status: 500 }
      );
    }
    const retry = await upload();
    if (retry.error) {
      return NextResponse.json(
        { error: retry.error.message ?? "Upload failed" },
        { status: 500 }
      );
    }
  } else if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message ?? "Upload failed" },
      { status: 500 }
    );
  }

  const { error: updateError } = await admin
    .from("catechumenes")
    .update({ photo_path: path })
    .eq("id", catechumeneId);

  if (updateError) {
    await admin.storage.from(CATECHUMENE_PHOTOS_BUCKET).remove([path]);
    return NextResponse.json(
      { error: updateError.message ?? "Failed to update catechumene" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, photo_path: path }, { status: 200 });
}

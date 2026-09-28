import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadCatechumenePhotoVariants } from "@/lib/catechumene-photo-storage";

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

  const allowedRoles = ["admin", "responsable"];
  if (meError || !me || !allowedRoles.includes(me.role)) {
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
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await uploadCatechumenePhotoVariants(
      admin,
      catechumeneId,
      existing.photo_path ?? null,
      buffer
    );
    return NextResponse.json(
      {
        ok: true,
        photo_path: result.photo_path,
        variants: {
          small: {
            width: result.generated.small.width,
            height: result.generated.small.height,
            bytes: result.generated.small.bytes
          },
          large: {
            width: result.generated.large.width,
            height: result.generated.large.height,
            bytes: result.generated.large.bytes
          }
        }
      },
      { status: 200 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Échec de l'upload de la photo.";
    const isClient =
      /illisible|format non supporté|dimensions exploitables/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: isClient ? 400 : 500 }
    );
  }
}

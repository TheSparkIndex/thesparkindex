import { NextResponse } from "next/server";
import { badRequest, requireApiToken } from "@/lib/content-api/auth";
import { storeUploadedImage } from "@/lib/services/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const text = (v: FormDataEntryValue | null, max: number) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

/** Sube una imagen (multipart: file, altText?, caption?, credit?). */
export async function POST(req: Request) {
  const denied = requireApiToken(req);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Envía la imagen como multipart/form-data.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("No se recibió ningún archivo en el campo 'file'.");

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const media = await storeUploadedImage(buffer, file.type || "application/octet-stream", file.name, {
      altText: text(form.get("altText"), 300),
      caption: text(form.get("caption"), 600),
      credit: text(form.get("credit"), 300),
    });
    return NextResponse.json({
      id: media.id,
      url: media.url,
      width: media.width,
      height: media.height,
      variants: media.variants,
    });
  } catch (e) {
    return badRequest((e as Error).message || "No se pudo procesar la imagen.", 422);
  }
}

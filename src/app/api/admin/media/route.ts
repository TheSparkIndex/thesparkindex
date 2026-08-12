import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { processImage, validateUpload } from "@/lib/services/media";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? 40), 1), 120);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const media = await db.media.findMany({
    where: q ? { filename: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take,
  });
  return NextResponse.json({ media });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }

  const mimeType = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    validateUpload(buffer, mimeType);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  try {
    const generated = await processImage(buffer, mimeType);
    const media = await db.media.create({
      data: {
        filename: file.name,
        url: generated.originalUrl,
        mimeType,
        size: buffer.byteLength,
        width: generated.width || null,
        height: generated.height || null,
        variants: generated.variants,
      },
    });
    return NextResponse.json({ media });
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la imagen." }, { status: 500 });
  }
}

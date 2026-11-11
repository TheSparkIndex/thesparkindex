import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { badRequest, requireApiToken } from "@/lib/content-api/auth";
import { authorSchema } from "@/lib/validations";
import { persistAuthor } from "@/lib/services/content-writer";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireApiToken(req);
  if (denied) return denied;

  const authors = await db.author.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, role: true, program: true, isActive: true },
  });
  return NextResponse.json({ authors });
}

/** Crea o actualiza un autor (por slug; si no se envía, se deriva del nombre). */
export async function POST(req: Request) {
  const denied = requireApiToken(req);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("El cuerpo debe ser JSON.");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : slugify(name);
  const existing = slug ? await db.author.findUnique({ where: { slug } }) : null;

  let parsed: z.infer<typeof authorSchema>;
  try {
    parsed = authorSchema.parse({
      name,
      slug,
      bio: body.bio ?? existing?.bio ?? null,
      // Si no se envía foto, se conserva la actual.
      photoId: body.photoId ?? existing?.photoId ?? null,
      role: body.role ?? existing?.role ?? null,
      program: body.program ?? existing?.program ?? null,
      cohort: body.cohort ?? existing?.cohort ?? null,
      socialLinks: body.socialLinks ?? existing?.socialLinks ?? null,
      isActive: typeof body.isActive === "boolean" ? body.isActive : (existing?.isActive ?? true),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return badRequest(e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · "));
    return badRequest("Datos inválidos.");
  }

  const result = await persistAuthor(parsed);
  if (!result.ok) return badRequest(result.error ?? "No se pudo guardar el autor.", 422);
  return NextResponse.json({ id: result.authorId, slug: result.slug, created: !existing });
}

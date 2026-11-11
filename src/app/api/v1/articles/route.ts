import { NextResponse } from "next/server";
import { badRequest, requireApiToken } from "@/lib/content-api/auth";
import { listArticles, upsertArticle } from "@/lib/content-api/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireApiToken(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const articles = await listArticles({
    status: url.searchParams.get("status"),
    q: url.searchParams.get("q"),
    take: Number(url.searchParams.get("take") ?? 50),
  });
  return NextResponse.json({ articles });
}

/**
 * Crea o actualiza (por slug) un artículo.
 * Contenido: `markdown` (recomendado) o `content` (JSON de TipTap).
 * Sección por `section` (slug) o `sectionId`. Autores por slug o id.
 */
export async function POST(req: Request) {
  const denied = requireApiToken(req);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("El cuerpo debe ser JSON.");
  }
  const result = await upsertArticle(body);
  if (!result.ok) return badRequest(result.error, result.status);
  return NextResponse.json(result.data);
}

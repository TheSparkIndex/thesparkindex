import { NextResponse } from "next/server";
import { badRequest, requireApiToken } from "@/lib/content-api/auth";
import { listAuthors, upsertAuthor } from "@/lib/content-api/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireApiToken(req);
  if (denied) return denied;
  return NextResponse.json({ authors: await listAuthors() });
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
  const result = await upsertAuthor(body);
  if (!result.ok) return badRequest(result.error, result.status);
  return NextResponse.json(result.data);
}

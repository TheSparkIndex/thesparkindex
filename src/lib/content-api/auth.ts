import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Autenticación de la API de contenido (/api/v1) con un token estático.
 *
 * Se activa definiendo CONTENT_API_TOKEN (mínimo 32 caracteres) en el entorno.
 * Sin esa variable la API responde 404, como si no existiera.
 * El cliente envía:  Authorization: Bearer <token>
 */
const MIN_TOKEN_LENGTH = 32;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Devuelve una respuesta de error si la petición no está autorizada; null si puede seguir. */
export function requireApiToken(req: Request): NextResponse | null {
  const expected = process.env.CONTENT_API_TOKEN ?? "";
  if (expected.length < MIN_TOKEN_LENGTH) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const provided = match?.[1]?.trim() ?? "";

  if (!provided || !timingSafeEqual(digest(provided), digest(expected))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  return null;
}

export function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

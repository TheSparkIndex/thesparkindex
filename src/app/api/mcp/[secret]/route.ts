import { createHash, timingSafeEqual } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildMcpServer } from "@/lib/content-api/mcp-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * MCP remoto: https://<sitio>/api/mcp/<MCP_URL_SECRET>
 * La parte secreta de la URL funciona como contraseña (los conectores de claude.ai
 * no permiten encabezados propios). Sin MCP_URL_SECRET (mín. 32 caracteres) responde 404.
 */
const digest = (v: string) => createHash("sha256").update(v).digest();

function authorized(secret: string): boolean {
  const expected = process.env.MCP_URL_SECRET ?? "";
  if (expected.length < 32) return false;
  return timingSafeEqual(digest(secret), digest(expected));
}

async function handle(req: Request, ctx: { params: Promise<{ secret: string }> }) {
  const { secret } = await ctx.params;
  if (!authorized(secret)) {
    return new Response("Not found", { status: 404 });
  }
  // Modo sin estado: un servidor y un transporte por petición.
  const server = buildMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    // La respuesta JSON ya está completa: liberar recursos.
    void server.close();
  }
}

export { handle as GET, handle as POST, handle as DELETE };

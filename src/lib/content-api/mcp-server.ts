import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SITE } from "@/lib/site";
import { tiptapToMarkdown } from "@/lib/content/to-markdown";
import {
  findMediaByUrl,
  getArticle,
  importImageFromUrl,
  listArticles,
  listAuthors,
  listSections,
  upsertArticle,
  upsertAuthor,
} from "@/lib/content-api/operations";

/**
 * MCP remoto de la revista (Streamable HTTP, sin estado). Pensado para clientes en la web
 * (conectores de claude.ai): las imágenes entran por URL pública, no por archivos locales.
 */

const INSTRUCTIONS = `Herramientas para publicar en KEY — The Spark Index, la revista estudiantil de Key Institute.
Flujo típico: spark_list_sections → spark_save_article (los autores se crean solos por nombre).
Los artículos nuevos quedan como borrador salvo que el usuario pida publicarlos (status "published").
Publicar exige sección, autor, contenido e imagen de portada (heroImageUrl o heroMediaId).
Para editar uno existente: spark_get_article → modifica el Markdown → spark_save_article con el mismo slug.`;

const ROLE = z.enum(["author", "collaborator", "photographer", "editor"]);
const STATUS = z.enum(["draft", "scheduled", "published", "archived"]);

type ToolResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };
const ok = (data: unknown): ToolResult => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const err = (message: string): ToolResult => ({ isError: true, content: [{ type: "text", text: message }] });

function guard<A>(fn: (args: A) => Promise<ToolResult>) {
  return async (args: A): Promise<ToolResult> => {
    try {
      return await fn(args);
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  };
}

const ownMedia = (src: string) => src.startsWith("/media/") || src.startsWith(`${SITE.url}/media/`);

/** Importa las imágenes externas del Markdown a la biblioteca y reemplaza sus URLs. */
async function importInlineImages(markdown: string, credit?: string) {
  const pattern = /!\[([^\]]*)\]\((?:<([^>]+)>|([^)\s]+))\)/g;
  let out = "";
  let last = 0;
  let imported = 0;
  for (const m of markdown.matchAll(pattern)) {
    const alt = m[1];
    const src = (m[2] ?? m[3]).trim();
    out += markdown.slice(last, m.index);
    last = (m.index ?? 0) + m[0].length;
    if (ownMedia(src)) {
      out += `![${alt}](${src.replace(SITE.url, "")})`;
      continue;
    }
    const media = await importImageFromUrl(src, { altText: alt, credit: credit ?? null });
    imported++;
    out += `![${alt}](${media.url})`;
  }
  return { markdown: out + markdown.slice(last), imported };
}

export function buildMcpServer(): McpServer {
  const server = new McpServer({ name: "thesparkindex", version: "1.0.0" }, { instructions: INSTRUCTIONS });

  server.registerTool(
    "spark_list_sections",
    {
      title: "Listar secciones",
      description: "Secciones de la revista (slug y nombre). Usa el slug en spark_save_article.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    guard(async () => ok(await listSections()))
  );

  server.registerTool(
    "spark_list_authors",
    {
      title: "Listar autores",
      description: "Autores registrados (slug, nombre, rol).",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    guard(async () => ok(await listAuthors()))
  );

  server.registerTool(
    "spark_list_articles",
    {
      title: "Listar artículos",
      description: "Artículos más recientes con estado, sección, autores y URL pública.",
      inputSchema: {
        status: STATUS.optional(),
        query: z.string().optional().describe("Texto a buscar en el título"),
        limit: z.number().int().min(1).max(200).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ status, query, limit }) => ok(await listArticles({ status, q: query, take: limit })))
  );

  server.registerTool(
    "spark_get_article",
    {
      title: "Ver artículo",
      description: "Devuelve un artículo con su cuerpo en Markdown, para revisarlo o editarlo.",
      inputSchema: { slug: z.string().describe("Slug del artículo (ver spark_list_articles)") },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ slug }) => {
      const a = await getArticle(slug);
      if (!a) return err(`No existe el artículo '${slug}'.`);
      const { content, ...rest } = a;
      return ok({ ...rest, url: `${SITE.url}/articulos/${a.slug}`, markdown: tiptapToMarkdown(content) });
    })
  );

  server.registerTool(
    "spark_save_author",
    {
      title: "Crear o actualizar autor",
      description:
        "Crea un autor o actualiza el que tenga el mismo slug (derivado del nombre si no se da). " +
        "Los campos omitidos conservan su valor. photoUrl importa una foto pública como avatar.",
      inputSchema: {
        name: z.string().min(2),
        slug: z.string().optional(),
        role: z.string().max(80).optional().describe("Rol en la revista, p. ej. 'Redactora'"),
        program: z.string().max(120).optional().describe("Carrera o programa"),
        cohort: z.string().max(80).optional(),
        bio: z.string().max(2000).optional(),
        photoUrl: z.string().url().optional(),
      },
      annotations: { idempotentHint: true },
    },
    guard(async ({ photoUrl, ...author }) => {
      const photoId = photoUrl ? (await importImageFromUrl(photoUrl, { altText: author.name })).id : undefined;
      const r = await upsertAuthor({ ...author, ...(photoId ? { photoId } : {}) });
      return r.ok ? ok(r.data) : err(r.error);
    })
  );

  server.registerTool(
    "spark_upload_image",
    {
      title: "Importar imagen desde URL",
      description:
        "Descarga una imagen pública (JPG, PNG, WebP, AVIF o GIF; máx. 10 MB) a la biblioteca de medios. " +
        "Devuelve id (para heroMediaId) y url (para usar en el Markdown).",
      inputSchema: {
        url: z.string().url(),
        altText: z.string().max(300).optional(),
        caption: z.string().max(600).optional(),
        credit: z.string().max(300).optional(),
      },
    },
    guard(async ({ url, ...meta }) => {
      const media = await importImageFromUrl(url, meta);
      return ok({ id: media.id, url: media.url, width: media.width, height: media.height });
    })
  );

  server.registerTool(
    "spark_save_article",
    {
      title: "Crear o actualizar artículo",
      description: [
        "Crea un artículo o actualiza el que tenga el mismo slug (derivado del título si no se da).",
        "Por defecto queda como borrador; usa status 'published' solo si el usuario pidió publicar.",
        "Autores por nombre: si no existen se crean.",
        "",
        "Markdown: '## Título', '### Subtítulo', párrafos separados por línea en blanco, **negrita**,",
        "*cursiva*, [enlace](https://...), listas '- ' o '1. ', '> cita', '>> Cita destacada — Autor',",
        "'---', una URL de YouTube sola en su línea, e imágenes '![alt](https://...)' (se importan solas).",
        "No repitas en el cuerpo el título, el subtítulo ni el autor: el sitio ya los muestra.",
      ].join("\n"),
      inputSchema: {
        title: z.string().min(3).max(200),
        slug: z.string().optional(),
        subtitle: z.string().max(300).optional(),
        excerpt: z.string().max(600).optional().describe("Resumen corto para tarjetas y buscadores"),
        markdown: z.string(),
        section: z.string().describe("Slug de la sección (ver spark_list_sections)"),
        authors: z
          .array(
            z.object({
              name: z.string().optional().describe("Nombre (se crea si no existe)"),
              slug: z.string().optional().describe("O slug de un autor existente"),
              role: ROLE.optional(),
            })
          )
          .min(1),
        heroImageUrl: z
          .string()
          .optional()
          .describe("URL pública de la portada, o una URL /media/... de la biblioteca del sitio"),
        heroMediaId: z.string().optional().describe("Id de una imagen ya subida"),
        heroAltText: z.string().max(300).optional(),
        imageCaption: z.string().max(600).optional(),
        imageCredit: z.string().max(300).optional(),
        tags: z.array(z.string()).max(10).optional(),
        status: STATUS.optional(),
        featured: z.boolean().optional(),
        publishedAt: z.string().optional().describe("ISO 8601, para fechas pasadas"),
        scheduledAt: z.string().optional().describe("ISO 8601 futura si status es 'scheduled'"),
      },
      annotations: { idempotentHint: true },
    },
    guard(async (args) => {
      const { authors, heroImageUrl, heroAltText, imageCredit, markdown, ...rest } = args;

      const contributors: Array<{ slug: string; role: z.infer<typeof ROLE> }> = [];
      for (const a of authors) {
        const role = a.role ?? "author";
        if (a.slug && !a.name) {
          contributors.push({ slug: a.slug, role });
          continue;
        }
        if (!a.name) return err("Cada autor necesita 'name' o 'slug'.");
        const r = await upsertAuthor({ name: a.name, ...(a.slug ? { slug: a.slug } : {}) });
        if (!r.ok) return err(r.error);
        contributors.push({ slug: r.data.slug, role });
      }

      let heroMediaId = rest.heroMediaId;
      if (heroImageUrl) {
        const existing = await findMediaByUrl(heroImageUrl);
        heroMediaId =
          existing?.id ??
          (await importImageFromUrl(heroImageUrl, { altText: heroAltText ?? args.title, credit: imageCredit ?? null })).id;
      }
      const inline = await importInlineImages(markdown, imageCredit);

      const r = await upsertArticle({
        ...rest,
        heroMediaId,
        markdown: inline.markdown,
        authors: contributors,
        status: rest.status ?? "draft",
      });
      return r.ok ? ok({ ...r.data, heroMediaId, inlineImagesImported: inline.imported }) : err(r.error);
    })
  );

  return server;
}

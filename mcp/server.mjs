#!/usr/bin/env node
// Servidor MCP (stdio) para KEY — The Spark Index.
// Habla con la API de contenido del sitio (/api/v1) usando un token.
//
// Variables de entorno:
//   SPARK_API_URL    URL del sitio, p. ej. https://thesparkindex.canariostudios.com
//   SPARK_API_TOKEN  Valor de CONTENT_API_TOKEN configurado en el servidor
import { readFile } from "node:fs/promises";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

const API_URL = (process.env.SPARK_API_URL ?? "").replace(/\/+$/, "");
const API_TOKEN = process.env.SPARK_API_TOKEN ?? "";

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

class ApiError extends Error {}

async function api(method, route, { json, form } = {}) {
  if (!API_URL || !API_TOKEN) {
    throw new ApiError("Faltan SPARK_API_URL o SPARK_API_TOKEN en la configuración del MCP.");
  }
  const res = await fetch(`${API_URL}/api/v1${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      ...(json ? { "Content-Type": "application/json" } : {}),
    },
    body: json ? JSON.stringify(json) : form,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  if (!res.ok) {
    const hint =
      res.status === 401
        ? " (token incorrecto)"
        : res.status === 404 && route !== "/articles"
          ? " (¿la API está activada? Define CONTENT_API_TOKEN en el servidor)"
          : "";
    throw new ApiError(`${method} ${route} → ${res.status}${hint}: ${data.error ?? JSON.stringify(data)}`);
  }
  return data;
}

async function uploadImage(filePath, meta = {}) {
  const abs = path.resolve(filePath);
  const ext = path.extname(abs).toLowerCase();
  const type = MIME[ext];
  if (!type) throw new ApiError(`Formato no soportado: ${ext}. Usa JPG, PNG, WebP, AVIF, GIF o SVG.`);
  let buffer;
  try {
    buffer = await readFile(abs);
  } catch {
    throw new ApiError(`No se pudo leer la imagen: ${abs}`);
  }
  const form = new FormData();
  form.append("file", new Blob([buffer], { type }), path.basename(abs));
  for (const key of ["altText", "caption", "credit"]) {
    if (meta[key]) form.append(key, meta[key]);
  }
  return api("POST", "/media", { form });
}

const isRemote = (src) => /^(https?:)?\/\//i.test(src) || src.startsWith("/media/");

/** Sube las imágenes locales referenciadas en el Markdown y reemplaza sus rutas por URLs. */
async function uploadInlineImages(markdown, baseDir, credit) {
  const pattern = /!\[([^\]]*)\]\((?:<([^>]+)>|([^)]+))\)/g;
  const uploaded = [];
  let result = "";
  let last = 0;
  for (const m of markdown.matchAll(pattern)) {
    const alt = m[1];
    const src = (m[2] ?? m[3]).trim();
    result += markdown.slice(last, m.index);
    last = m.index + m[0].length;
    if (isRemote(src)) {
      result += m[0];
      continue;
    }
    const file = path.isAbsolute(src) ? src : path.resolve(baseDir ?? process.cwd(), src);
    const media = await uploadImage(file, { altText: alt, credit });
    uploaded.push({ file, id: media.id, url: media.url });
    result += `![${alt}](${media.url})`;
  }
  result += markdown.slice(last);
  return { markdown: result, uploaded };
}

const ok = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const fail = (err) => ({
  isError: true,
  content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
});
const handle = (fn) => async (args) => {
  try {
    return ok(await fn(args));
  } catch (err) {
    return fail(err);
  }
};

const server = new McpServer({ name: "thesparkindex", version: "1.0.0" });

server.registerTool(
  "spark_list_sections",
  {
    title: "Listar secciones",
    description: "Lista las secciones de la revista (slug y nombre). Usa el slug en spark_save_article.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  handle(async () => api("GET", "/sections")),
);

server.registerTool(
  "spark_list_authors",
  {
    title: "Listar autores",
    description: "Lista los autores registrados (slug, nombre, rol). Usa el slug en spark_save_article.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  handle(async () => api("GET", "/authors")),
);

server.registerTool(
  "spark_save_author",
  {
    title: "Crear o actualizar autor",
    description:
      "Crea un autor o actualiza el existente con el mismo slug (si no se da, se deriva del nombre). " +
      "Los campos omitidos conservan su valor actual. photoPath sube una foto local como avatar.",
    inputSchema: {
      name: z.string().min(2).describe("Nombre completo"),
      slug: z.string().optional().describe("Identificador en la URL; por defecto, el nombre en minúsculas con guiones"),
      role: z.string().max(80).optional().describe("Rol en la revista, p. ej. 'Redactora'"),
      program: z.string().max(120).optional().describe("Carrera o programa"),
      cohort: z.string().max(80).optional().describe("Cohorte o generación, p. ej. 'C2'"),
      bio: z.string().max(2000).optional(),
      photoPath: z.string().optional().describe("Ruta local a la foto del autor"),
    },
    annotations: { idempotentHint: true },
  },
  handle(async ({ photoPath, ...author }) => {
    let photoId;
    if (photoPath) photoId = (await uploadImage(photoPath, { altText: author.name })).id;
    return api("POST", "/authors", { json: { ...author, ...(photoId ? { photoId } : {}) } });
  }),
);

server.registerTool(
  "spark_upload_image",
  {
    title: "Subir imagen",
    description:
      "Sube una imagen local a la biblioteca de medios (se generan variantes optimizadas). Devuelve id y url.",
    inputSchema: {
      path: z.string().describe("Ruta local de la imagen (JPG, PNG, WebP, AVIF, GIF o SVG; máx. 10 MB)"),
      altText: z.string().max(300).optional().describe("Texto alternativo (accesibilidad)"),
      caption: z.string().max(600).optional(),
      credit: z.string().max(300).optional().describe("Crédito de la foto"),
    },
  },
  handle(async ({ path: filePath, ...meta }) => uploadImage(filePath, meta)),
);

server.registerTool(
  "spark_list_articles",
  {
    title: "Listar artículos",
    description: "Lista artículos (más recientes primero), con estado, sección, autores y URL pública.",
    inputSchema: {
      status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
      query: z.string().optional().describe("Filtra por texto en el título"),
      limit: z.number().int().min(1).max(200).optional(),
    },
    annotations: { readOnlyHint: true },
  },
  handle(async ({ status, query, limit }) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    if (limit) params.set("take", String(limit));
    const qs = params.toString();
    return api("GET", `/articles${qs ? `?${qs}` : ""}`);
  }),
);

server.registerTool(
  "spark_save_article",
  {
    title: "Crear o actualizar artículo",
    description: [
      "Crea un artículo, o actualiza el que tenga el mismo slug (el slug se deriva del título si no se da).",
      "Por defecto queda como borrador (status 'draft'); usa status 'published' solo si el usuario pidió publicar.",
      "Publicar exige: sección, al menos un autor, contenido e imagen de portada.",
      "",
      "Contenido en Markdown: '## Título', '### Subtítulo', párrafos separados por línea en blanco,",
      "**negrita**, *cursiva*, [enlace](https://...), listas '- ' o '1. ', '> cita',",
      "'>> Cita destacada — Autor' (cita grande), '---', una URL de YouTube sola en su línea,",
      "e imágenes '![alt](ruta)'. Las rutas locales de imágenes se suben automáticamente",
      "(usa '![alt](<C:\\ruta con espacios\\foto.jpg>)' si la ruta tiene espacios).",
      "No repitas el título, subtítulo ni el autor dentro del Markdown: el sitio ya los muestra.",
    ].join("\n"),
    inputSchema: {
      title: z.string().min(3).max(200),
      slug: z.string().optional(),
      subtitle: z.string().max(300).optional().describe("Bajada que aparece bajo el título"),
      excerpt: z.string().max(600).optional().describe("Resumen corto para tarjetas y buscadores"),
      markdown: z.string().describe("Cuerpo del artículo en Markdown"),
      section: z.string().describe("Slug de la sección (ver spark_list_sections)"),
      authors: z
        .array(
          z.object({
            slug: z.string(),
            role: z.enum(["author", "collaborator", "photographer", "editor"]).optional(),
          }),
        )
        .min(1)
        .describe("Autores por slug (ver spark_list_authors / spark_save_author)"),
      heroImagePath: z.string().optional().describe("Ruta local de la imagen de portada (se sube automáticamente)"),
      heroMediaId: z.string().optional().describe("Id de una imagen ya subida, en lugar de heroImagePath"),
      heroAltText: z.string().max(300).optional(),
      imageCaption: z.string().max(600).optional().describe("Pie de foto de la portada"),
      imageCredit: z.string().max(300).optional().describe("Crédito de las fotos que se suban"),
      tags: z.array(z.string()).max(10).optional(),
      status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
      featured: z.boolean().optional().describe("Destacar en el inicio"),
      publishedAt: z.string().optional().describe("Fecha de publicación ISO 8601 (para artículos con fecha pasada)"),
      scheduledAt: z.string().optional().describe("Fecha futura ISO 8601 si status es 'scheduled'"),
      imagesBaseDir: z.string().optional().describe("Carpeta base para rutas relativas de imágenes en el Markdown"),
    },
    annotations: { idempotentHint: true },
  },
  handle(async (args) => saveArticle(args)),
);

server.registerTool(
  "spark_publish_file",
  {
    title: "Publicar artículo desde archivo Markdown",
    description: [
      "Crea o actualiza un artículo a partir de un archivo .md con encabezado YAML (front matter).",
      "Las rutas de imágenes (portada y dentro del texto) son relativas a la carpeta del archivo.",
      "Los autores se crean automáticamente si no existen. Ejemplo:",
      "---",
      "title: Key Institute avanza en la ICPC regional 2025",
      "subtitle: Disciplina, estrategia y pasión por el código   # opcional",
      "excerpt: Resumen corto para tarjetas                      # opcional",
      "section: noticias            # slug (ver spark_list_sections)",
      "authors:                     # nombres, o { name, role } / { slug, role }",
      "  - Luis Pocasangre",
      "  - { name: Ana Pérez, role: photographer }",
      "hero: fotos/portada.jpg      # imagen de portada",
      "heroAlt: Equipo de Key en la UCA",
      "imageCaption: Pie de foto",
      "imageCredit: Crédito de fotos",
      "tags: [ICPC, Programación]",
      "status: published           # draft (por defecto) | published | scheduled | archived",
      "featured: false",
      "publishedAt: 2025-09-13     # opcional",
      "---",
      "Cuerpo en Markdown (mismo formato que spark_save_article).",
    ].join("\n"),
    inputSchema: {
      path: z.string().describe("Ruta del archivo .md"),
      status: z
        .enum(["draft", "scheduled", "published", "archived"])
        .optional()
        .describe("Sobrescribe el status del archivo"),
    },
    annotations: { idempotentHint: true },
  },
  handle(async ({ path: filePath, status }) => {
    const abs = path.resolve(filePath);
    const raw = await readFile(abs, "utf8").catch(() => {
      throw new ApiError(`No se pudo leer el archivo: ${abs}`);
    });
    const fm = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
    if (!fm) throw new ApiError("El archivo debe empezar con un encabezado YAML entre líneas '---'.");
    let meta;
    try {
      meta = parseYaml(fm[1]) ?? {};
    } catch (e) {
      throw new ApiError(`Encabezado YAML inválido: ${e.message}`);
    }
    if (!meta.title) throw new ApiError("Falta 'title' en el encabezado.");
    if (!meta.section) throw new ApiError("Falta 'section' en el encabezado.");
    const baseDir = path.dirname(abs);

    const authors = [];
    for (const entry of [].concat(meta.authors ?? meta.author ?? [])) {
      const a = typeof entry === "string" ? { name: entry } : entry;
      const role = a.role ?? "author";
      if (a.slug && !a.name) {
        authors.push({ slug: a.slug, role });
        continue;
      }
      if (!a.name) throw new ApiError("Cada autor necesita 'name' o 'slug'.");
      const saved = await api("POST", "/authors", { json: { name: a.name, ...(a.slug ? { slug: a.slug } : {}) } });
      authors.push({ slug: saved.slug, role });
    }
    if (!authors.length) throw new ApiError("Falta 'authors' en el encabezado.");

    const date = (v) => (v instanceof Date ? v.toISOString() : v ? String(v) : undefined);
    return saveArticle({
      title: String(meta.title),
      slug: meta.slug,
      subtitle: meta.subtitle,
      excerpt: meta.excerpt,
      markdown: fm[2],
      section: String(meta.section),
      authors,
      heroImagePath: meta.hero ? path.resolve(baseDir, String(meta.hero)) : undefined,
      heroMediaId: meta.heroMediaId,
      heroAltText: meta.heroAlt,
      imageCaption: meta.imageCaption,
      imageCredit: meta.imageCredit,
      tags: meta.tags,
      status: status ?? meta.status,
      featured: meta.featured === true,
      publishedAt: date(meta.publishedAt),
      scheduledAt: date(meta.scheduledAt),
      imagesBaseDir: baseDir,
    });
  }),
);

async function saveArticle(args) {
  const { heroImagePath, heroAltText, imageCredit, imagesBaseDir, markdown, authors, ...rest } = args;

  let heroMediaId = args.heroMediaId;
  if (heroImagePath) {
    const hero = await uploadImage(heroImagePath, { altText: heroAltText ?? args.title, credit: imageCredit });
    heroMediaId = hero.id;
  }
  const inline = await uploadInlineImages(markdown, imagesBaseDir, imageCredit);

  const saved = await api("POST", "/articles", {
    json: {
      ...rest,
      heroMediaId,
      markdown: inline.markdown,
      authors: authors.map((a) => ({ slug: a.slug, role: a.role ?? "author" })),
      status: args.status ?? "draft",
    },
  });
  return { ...saved, heroMediaId, inlineImagesUploaded: inline.uploaded.length };
}

await server.connect(new StdioServerTransport());

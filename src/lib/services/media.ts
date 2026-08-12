import { createId } from "@/lib/id";
import { storage } from "@/lib/storage";
import sharp from "sharp";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type GeneratedVariant = {
  key: string;
  url: string;
  width: number;
  height: number;
  mimeType: string;
};

export type GeneratedImage = {
  originalKey: string;
  originalUrl: string;
  variants: Record<string, GeneratedVariant>;
  width: number;
  height: number;
};

export function validateUpload(buffer: Buffer, mimeType: string): void {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error("Tipo de archivo no permitido. Usa JPG, PNG, WebP, AVIF, GIF o SVG.");
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("El archivo supera el tamaño máximo de 10MB.");
  }
}

function extFor(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  return map[mime] ?? "bin";
}

export async function processImage(
  buffer: Buffer,
  mimeType: string
): Promise<GeneratedImage> {
  if (mimeType === "image/svg+xml") {
    const id = createId();
    const key = `images/${id}/original.svg`;
    await storage.put(key, buffer, { contentType: mimeType });
    return {
      originalKey: key,
      originalUrl: storage.urlFor(key),
      variants: {},
      width: 0,
      height: 0,
    };
  }

  const id = createId();
  const base = `images/${id}`;
  const original = await sharp(buffer).rotate().webp({ quality: 82 }).toBuffer();
  const meta = await sharp(original).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const originalKey = `${base}/original.${extFor(mimeType)}`;
  await storage.put(originalKey, buffer, { contentType: mimeType });

  const jobs: Array<[string, number, { fit: "inside" | "cover"; height?: number }]> = [
    ["thumb", 480, { fit: "inside" }],
    ["card", 800, { fit: "inside" }],
    ["hero", 1280, { fit: "inside" }],
    ["wide", 1920, { fit: "inside" }],
    ["og", 1200, { fit: "cover", height: 630 }],
  ];

  const variants: Record<string, GeneratedVariant> = {};
  for (const [name, targetWidth, opts] of jobs) {
    const key = `${base}/${name}.webp`;
    const img = sharp(original).rotate().resize({ width: targetWidth, fit: opts.fit, height: opts.height });
    const out = await img.webp({ quality: 78 }).toBuffer();
    const m = await sharp(out).metadata();
    await storage.put(key, out, { contentType: "image/webp" });
    variants[name] = {
      key,
      url: storage.urlFor(key),
      width: m.width ?? targetWidth,
      height: m.height ?? 0,
      mimeType: "image/webp",
    };
  }

  return {
    originalKey,
    originalUrl: storage.urlFor(originalKey),
    variants,
    width,
    height,
  };
}

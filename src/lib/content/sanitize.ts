import type { TipMark, TipNode } from "@/lib/content/types";

export function isSafeHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (/^\s*(javascript|data|vbscript):/i.test(trimmed)) return false;
  try {
    const url = new URL(trimmed, "http://localhost");
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function toYouTubeEmbedUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  const patterns = [
    /youtu\.be\/([\w-]{6,})/,
    /youtube\.com\/watch\?.*v=([\w-]{6,})/,
    /youtube\.com\/embed\/([\w-]{6,})/,
  ];
  for (const p of patterns) {
    const m = raw.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

const ALLOWED_MARKS = new Set(["bold", "italic", "underline", "link", "strike", "code", "highlight"]);

function sanitizeMark(mark: TipMark[] | undefined): TipMark[] | undefined {
  if (!Array.isArray(mark)) return undefined;
  const clean = mark.filter((m) => {
    if (!ALLOWED_MARKS.has(m.type)) return false;
    if (m.type === "link" && !isSafeHttpUrl(m.attrs?.href)) return false;
    return true;
  });
  return clean.length ? clean : undefined;
}

function sanitizeNode(node: TipNode): TipNode | null {
  if (!node || typeof node.type !== "string") return null;

  switch (node.type) {
    case "paragraph":
    case "heading":
    case "text":
    case "bulletList":
    case "orderedList":
    case "listItem":
    case "blockquote":
    case "horizontalRule":
    case "pullQuote":
      break;
    case "image": {
      const src = isSafeHttpUrl(node.attrs?.src) ? (node.attrs?.src as string) : null;
      if (!src) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt.slice(0, 500) : "";
      const title = typeof node.attrs?.title === "string" ? node.attrs.title.slice(0, 500) : "";
      return { type: "image", attrs: { src, alt, title }, content: [] };
    }
    case "youtube": {
      const src = toYouTubeEmbedUrl(node.attrs?.src);
      if (!src) return null;
      return { type: "youtube", attrs: { src }, content: [] };
    }
    default:
      return null;
  }

  const content = Array.isArray(node.content)
    ? node.content.map(sanitizeNode).filter((n): n is TipNode => n !== null)
    : [];
  return {
    type: node.type,
    attrs: node.attrs,
    content,
    marks: node.text !== undefined ? sanitizeMark(node.marks) : undefined,
    text: node.text,
  };
}

export function sanitizeContent(json: unknown): TipNode[] {
  if (!Array.isArray(json)) return [];
  return json.map(sanitizeNode).filter((n): n is TipNode => n !== null);
}

import type { TipMark, TipNode } from "@/lib/content/types";

/**
 * Convierte un subconjunto de Markdown al JSON de TipTap que usa el editor.
 *
 * Bloques:
 *   ## Título / ### Subtítulo        → heading (nivel 2 o 3; "#" se trata como 2)
 *   - item / * item                  → bulletList
 *   1. item                          → orderedList
 *   > texto                          → blockquote
 *   >> texto — Autor                 → pullQuote (cita destacada; " — Autor" opcional)
 *   ![alt](url)                      → image (sola en su línea)
 *   https://youtube.com/...          → youtube (URL sola en su línea)
 *   ---                              → horizontalRule
 *   líneas seguidas                  → un párrafo (una línea en blanco separa párrafos)
 * En línea: **negrita**, *cursiva*, <u>subrayado</u>, [texto](url).
 */
export function markdownToTiptap(markdown: string): TipNode[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const nodes: TipNode[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (text) nodes.push(block("paragraph", text));
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      i++;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      const level = heading[1].length === 3 ? 3 : 2;
      nodes.push({ type: "heading", attrs: { level }, content: inline(heading[2].trim()) });
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      nodes.push({ type: "horizontalRule" });
      i++;
      continue;
    }

    const img = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/.exec(trimmed);
    if (img) {
      flushParagraph();
      nodes.push({ type: "image", attrs: { src: img[2], alt: img[1], title: img[3] ?? null }, content: [] });
      i++;
      continue;
    }

    if (/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/\S+$/.test(trimmed)) {
      flushParagraph();
      nodes.push({ type: "youtube", attrs: { src: trimmed }, content: [] });
      i++;
      continue;
    }

    if (trimmed.startsWith(">>")) {
      flushParagraph();
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">>")) {
        parts.push(lines[i].trim().replace(/^>>\s?/, ""));
        i++;
      }
      let text = parts.join(" ").trim();
      let author: string | undefined;
      const by = /\s+[—–-]{1,2}\s+([^—–]+)$/.exec(text);
      if (by) {
        author = by[1].trim();
        text = text.slice(0, by.index).trim();
      }
      nodes.push({
        type: "pullQuote",
        attrs: author ? { author } : {},
        // El nodo pullQuote del editor es "inline*": el texto va directo, sin párrafo.
        content: inline(stripQuotes(text)),
      });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">") && !lines[i].trim().startsWith(">>")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const inner = markdownToTiptap(quoteLines.join("\n"));
      nodes.push({ type: "blockquote", content: inner.length ? inner : [block("paragraph", "")] });
      continue;
    }

    const isBullet = (s: string) => /^[-*+]\s+/.test(s);
    const isOrdered = (s: string) => /^\d+[.)]\s+/.test(s);
    if (isBullet(trimmed) || isOrdered(trimmed)) {
      flushParagraph();
      const ordered = isOrdered(trimmed);
      const test = ordered ? isOrdered : isBullet;
      const items: TipNode[] = [];
      while (i < lines.length && test(lines[i].trim())) {
        const text = lines[i].trim().replace(ordered ? /^\d+[.)]\s+/ : /^[-*+]\s+/, "");
        items.push({ type: "listItem", content: [block("paragraph", text)] });
        i++;
      }
      nodes.push({ type: ordered ? "orderedList" : "bulletList", content: items });
      continue;
    }

    paragraph.push(trimmed);
    i++;
  }
  flushParagraph();
  return nodes;
}

function stripQuotes(text: string): string {
  return text.replace(/^["“«]\s*/, "").replace(/\s*["”»]$/, "");
}

function block(type: string, text: string): TipNode {
  const content = inline(text);
  return content.length ? { type, content } : { type };
}

const INLINE =
  /\*\*(.+?)\*\*|__(.+?)__|<u>(.+?)<\/u>|\[([^\]]+)\]\(([^)\s]+)\)|\*([^*\s][^*]*?)\*/;

function inline(text: string, marks: TipMark[] = []): TipNode[] {
  const out: TipNode[] = [];
  let rest = text;
  while (rest) {
    const m = INLINE.exec(rest);
    if (!m) {
      pushText(out, rest, marks);
      break;
    }
    if (m.index > 0) pushText(out, rest.slice(0, m.index), marks);
    if (m[1] !== undefined || m[2] !== undefined) {
      out.push(...inline(m[1] ?? m[2], [...marks, { type: "bold" }]));
    } else if (m[3] !== undefined) {
      out.push(...inline(m[3], [...marks, { type: "underline" }]));
    } else if (m[4] !== undefined) {
      out.push(...inline(m[4], [...marks, { type: "link", attrs: { href: m[5] } }]));
    } else {
      out.push(...inline(m[6], [...marks, { type: "italic" }]));
    }
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

function pushText(out: TipNode[], text: string, marks: TipMark[]) {
  if (!text) return;
  out.push(marks.length ? { type: "text", text, marks } : { type: "text", text });
}

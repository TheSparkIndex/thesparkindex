import type { TipNode } from "@/lib/content/types";

/** Convierte el JSON de TipTap al mismo subconjunto de Markdown que entiende markdownToTiptap. */
export function tiptapToMarkdown(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return (content as TipNode[]).map(blockToMd).filter((b) => b !== "").join("\n\n");
}

function blockToMd(node: TipNode): string {
  switch (node.type) {
    case "paragraph":
      return inlineToMd(node.content);
    case "heading":
      return `${(node.attrs?.level as number) === 3 ? "###" : "##"} ${inlineToMd(node.content)}`;
    case "bulletList":
      return (node.content ?? []).map((li) => `- ${listItemText(li)}`).join("\n");
    case "orderedList":
      return (node.content ?? []).map((li, i) => `${i + 1}. ${listItemText(li)}`).join("\n");
    case "blockquote":
      return (node.content ?? [])
        .map(blockToMd)
        .join("\n\n")
        .split("\n")
        .map((l) => (l ? `> ${l}` : ">"))
        .join("\n");
    case "pullQuote": {
      const author = typeof node.attrs?.author === "string" && node.attrs.author ? ` — ${node.attrs.author}` : "";
      const inner = (node.content ?? []).some((c) => c.type === "paragraph")
        ? (node.content ?? []).map((c) => inlineToMd(c.content)).join(" ")
        : inlineToMd(node.content);
      return `>> ${inner}${author}`;
    }
    case "horizontalRule":
      return "---";
    case "image":
      return `![${String(node.attrs?.alt ?? "")}](${String(node.attrs?.src ?? "")})`;
    case "youtube":
      return String(node.attrs?.src ?? "");
    default:
      return inlineToMd(node.content);
  }
}

function listItemText(li: TipNode): string {
  return (li.content ?? []).map((c) => inlineToMd(c.content)).join(" ");
}

function inlineToMd(nodes: TipNode[] | undefined): string {
  return (nodes ?? [])
    .map((n) => {
      if (n.type !== "text") return "";
      let text = n.text ?? "";
      const marks = n.marks ?? [];
      const link = marks.find((m) => m.type === "link");
      if (marks.some((m) => m.type === "italic")) text = `*${text}*`;
      if (marks.some((m) => m.type === "bold")) text = `**${text}**`;
      if (marks.some((m) => m.type === "underline")) text = `<u>${text}</u>`;
      if (link) text = `[${text}](${String(link.attrs?.href ?? "")})`;
      return text;
    })
    .join("");
}

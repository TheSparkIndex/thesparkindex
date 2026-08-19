import Image from "next/image";
import { cn } from "@/lib/utils";
import type { TipNode as Node } from "@/lib/content/types";

function Marks({ marks, children }: { marks?: Node["marks"]; children: React.ReactNode }) {
  let node = <>{children}</>;
  if (!marks) return node;
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        node = <strong>{node}</strong>;
        break;
      case "italic":
        node = <em>{node}</em>;
        break;
      case "underline":
        node = <u>{node}</u>;
        break;
      case "strike":
        node = <s>{node}</s>;
        break;
      case "code":
        node = <code className="rounded bg-key-surface-alt px-1.5 py-0.5 text-sm">{node}</code>;
        break;
      case "highlight":
        node = <mark className="marker-lime bg-transparent">{node}</mark>;
        break;
      case "link":
        node = (
          <a href={String(mark.attrs?.href ?? "#")} target="_blank" rel="noopener noreferrer">
            {node}
          </a>
        );
        break;
    }
  }
  return <>{node}</>;
}

function TextNode({ node }: { node: Node }) {
  return (
    <Marks marks={node.marks}>
      <>{node.text}</>
    </Marks>
  );
}

function PullQuote({ node }: { node: Node }) {
  const text = (node.content ?? [])
    .map((c) => c.text ?? "")
    .join("");
  return (
    <figure className="my-10 rounded-r-card border-l-4 bg-key-primary-soft px-6 py-6 sm:px-8 sm:py-8" style={{ borderColor: "var(--color-key-primary)" }}>
      <blockquote className="display text-2xl leading-snug text-key-ink sm:text-3xl">{text}</blockquote>
    </figure>
  );
}

function NodeRenderer({ node }: { node: Node }) {
  switch (node.type) {
    case "text":
      return <TextNode node={node} />;
    case "paragraph":
      return <p>{node.content?.map((c, i) => <NodeRenderer key={i} node={c} />)}</p>;
    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const Tag = level === 3 ? "h3" : "h2";
      return <Tag>{node.content?.map((c, i) => <NodeRenderer key={i} node={c} />)}</Tag>;
    }
    case "bulletList":
      return <ul>{node.content?.map((c, i) => <NodeRenderer key={i} node={c} />)}</ul>;
    case "orderedList":
      return <ol>{node.content?.map((c, i) => <NodeRenderer key={i} node={c} />)}</ol>;
    case "listItem":
      return <li>{node.content?.map((c, i) => <NodeRenderer key={i} node={c} />)}</li>;
    case "blockquote":
      return <blockquote>{node.content?.map((c, i) => <NodeRenderer key={i} node={c} />)}</blockquote>;
    case "horizontalRule":
      return <hr />;
    case "image":
      return (
        <Image
          src={String(node.attrs?.src ?? "")}
          alt={String(node.attrs?.alt ?? "")}
          width={1280}
          height={720}
          className="my-6 h-auto w-full rounded-card object-cover"
          unoptimized
        />
      );
    case "youtube":
      return (
        <div className="my-8 aspect-video overflow-hidden rounded-card bg-key-ink">
          <iframe
            src={String(node.attrs?.src ?? "")}
            title="Video incrustado"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
      );
    case "pullQuote":
      return <PullQuote node={node} />;
    default:
      return null;
  }
}

export function ArticleBody({
  content,
  className,
}: {
  content: unknown;
  className?: string;
}) {
  const nodes = Array.isArray(content) ? (content as Node[]) : [];
  return (
    <div className={cn("prose-key", className)}>
      {nodes.map((n, i) => (
        <NodeRenderer key={i} node={n} />
      ))}
    </div>
  );
}

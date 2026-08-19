"use client";

import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import YouTube from "@tiptap/extension-youtube";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Link2,
  Unlink,
  Image as ImageIcon,
  CirclePlay,
  Minus,
  Undo2,
  Redo2,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { PullQuote } from "@/lib/editor/pull-quote";
import { cn } from "@/lib/utils";

export type TiptapEditorHandle = {
  insertImage: (src: string, alt?: string, title?: string) => void;
  insertYouTube: (url: string) => void;
};

type Props = {
  name: string;
  defaultValue?: unknown;
  placeholder?: string;
  onRequestImage?: () => void;
};

function ToolButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-md text-key-ink transition-colors hover:bg-key-primary-soft disabled:opacity-30",
        active && "bg-key-primary text-white hover:bg-key-primary"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-key-border" aria-hidden />;
}

export const TiptapEditor = forwardRef<TiptapEditorHandle, Props>(function TiptapEditor(
  { name, defaultValue, placeholder = "Escribe el contenido del artículo…", onRequestImage },
  ref
) {
  const [json, setJson] = useState<string>(() =>
    JSON.stringify(Array.isArray(defaultValue) ? defaultValue : [])
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      YouTube.configure({ controls: true, nocookie: true, width: 640, height: 360 }),
      PullQuote,
    ],
    content: {
      type: "doc",
      content: (Array.isArray(defaultValue) ? defaultValue : []) as never,
    },
    onUpdate: ({ editor }) => {
      setJson(JSON.stringify(editor.getJSON().content ?? []));
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      insertImage: (src, alt, title) => {
        editor?.chain().focus().setImage({ src, alt: alt ?? "", title: title ?? "" }).run();
      },
      insertYouTube: (url) => {
        editor?.chain().focus().setYoutubeVideo({ src: url }).run();
      },
    }),
    [editor]
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const togglePullQuote = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("pullQuote")) {
      editor.chain().focus().unsetPullQuote().run();
      return;
    }
    const author = window.prompt("Autor de la cita destacada (opcional)") ?? "";
    editor.chain().focus().setPullQuote(author.trim() || undefined).run();
  }, [editor]);

  if (!editor) return null;

  const setAlign = (align: "left" | "center" | "right") =>
    editor.chain().focus().setTextAlign(align).run();

  return (
    <div className="overflow-hidden rounded-xl border-2 border-key-border bg-key-white focus-within:border-key-primary">
      <input type="hidden" name={name} value={json} />
      <div className="flex flex-wrap items-center gap-0.5 border-b border-key-border bg-key-surface-alt px-2 py-1.5">
        <ToolButton label="Deshacer" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </ToolButton>
        <ToolButton label="Rehacer" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Párrafo" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          <Pilcrow className="size-4" />
        </ToolButton>
        {([1, 2, 3, 4] as const).map((level) => {
          const Icons = { 1: Heading1, 2: Heading2, 3: Heading3, 4: Heading4 };
          const Icon = Icons[level];
          return (
            <ToolButton
              key={level}
              label={`Título ${level}`}
              active={editor.isActive("heading", { level })}
              onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            >
              <Icon className="size-4" />
            </ToolButton>
          );
        })}
        <Divider />
        <ToolButton label="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton label="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton label="Subrayado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="size-4" />
        </ToolButton>
        <ToolButton label="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="size-4" />
        </ToolButton>
        <ToolButton label="Código" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Lista con viñetas" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="size-4" />
        </ToolButton>
        <ToolButton label="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </ToolButton>
        <ToolButton label="Bloque de cita" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="size-4" />
        </ToolButton>
        <ToolButton label="Cita destacada" active={editor.isActive("pullQuote")} onClick={togglePullQuote}>
          <span className="text-sm font-bold leading-none">Cita</span>
        </ToolButton>
        <ToolButton label="Bloque de código" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Alinear a la izquierda" active={editor.isActive({ textAlign: "left" })} onClick={() => setAlign("left")}>
          <AlignLeft className="size-4" />
        </ToolButton>
        <ToolButton label="Centrar" active={editor.isActive({ textAlign: "center" })} onClick={() => setAlign("center")}>
          <AlignCenter className="size-4" />
        </ToolButton>
        <ToolButton label="Alinear a la derecha" active={editor.isActive({ textAlign: "right" })} onClick={() => setAlign("right")}>
          <AlignRight className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Enlace" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="size-4" />
        </ToolButton>
        <ToolButton label="Quitar enlace" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink className="size-4" />
        </ToolButton>
        <ToolButton
          label="Imagen"
          onClick={() => {
            if (onRequestImage) {
              onRequestImage();
            } else {
              const url = window.prompt("URL de la imagen");
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }
          }}
        >
          <ImageIcon className="size-4" />
        </ToolButton>
        <ToolButton
          label="Video de YouTube"
          onClick={() => {
            const url = window.prompt("URL del video de YouTube");
            if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
          }}
        >
          <CirclePlay className="size-4" />
        </ToolButton>
        <ToolButton label="Línea divisoria" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="size-4" />
        </ToolButton>
      </div>
      <EditorContent editor={editor} className="tiptap-editor" />
    </div>
  );
});

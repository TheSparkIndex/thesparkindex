"use client";

import { useState } from "react";
import { Check, Copy, Link2, Mail, Share2 } from "lucide-react";
import { SITE } from "@/lib/site";

export function ShareButtons({ slug, title }: { slug: string; title: string }) {
  const url = `${SITE.url}/articulos/${slug}`;
  const [copied, setCopied] = useState(false);

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const iconBtn =
    "grid size-10 place-items-center rounded-full border-2 border-key-border text-key-ink transition-colors hover:border-key-primary hover:bg-key-primary-soft hover:text-key-primary";

  return (
    <div className="flex items-center gap-2">
      <span className="kicker mr-1 text-key-muted">Compartir</span>
      <button type="button" onClick={nativeShare} aria-label="Compartir" className={iconBtn}>
        <Share2 className="size-4" aria-hidden />
      </button>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en Facebook"
        className={iconBtn}
      >
        <span aria-hidden>f</span>
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir por WhatsApp"
        className={iconBtn}
      >
        <span aria-hidden>wa</span>
      </a>
      <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`} aria-label="Compartir por correo" className={iconBtn}>
        <Mail className="size-4" aria-hidden />
      </a>
      <button type="button" onClick={copy} aria-label="Copiar enlace" className={iconBtn}>
        {copied ? <Check className="size-4 text-key-teal" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      </button>
      <Link2 className="hidden" aria-hidden />
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null;
  alt: string;
  aspect?: string;
  sizes?: string;
  priority?: boolean;
  caption?: string | null;
  credit?: string | null;
  className?: string;
  imgClassName?: string;
};

export function ImageWithCaption({
  src,
  alt,
  aspect = "aspect-[4/3]",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority,
  caption,
  credit,
  className,
  imgClassName,
}: Props) {
  return (
    <figure className={cn("m-0", className)}>
      <div className={cn("relative w-full overflow-hidden", aspect)}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            unoptimized
            className={cn("object-cover", imgClassName)}
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-key-surface-alt">
            <span className="text-2xl font-bold text-key-muted">KEY</span>
          </div>
        )}
      </div>
      {(caption || credit) && (
        <figcaption className="mt-2 text-xs leading-5 text-key-muted">
          {caption}
          {caption && credit ? " — " : ""}
          {credit && <span className="italic">Foto: {credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}

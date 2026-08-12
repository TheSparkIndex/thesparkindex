import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-6 text-[0.6rem]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-14 text-xl",
  xxl: "size-28 text-5xl",
} as const;

export function Avatar({
  src,
  name,
  alt,
  size = "lg",
  className,
  ringClassName,
}: {
  src?: string | null;
  name: string;
  alt?: string;
  size?: keyof typeof sizes;
  className?: string;
  ringClassName?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        className={cn("shrink-0 rounded-full object-cover", sizes[size], ringClassName, className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-key-primary-soft font-black text-key-primary",
        sizes[size],
        className
      )}
      aria-hidden={alt ? undefined : true}
    >
      {name.charAt(0) || "K"}
    </span>
  );
}

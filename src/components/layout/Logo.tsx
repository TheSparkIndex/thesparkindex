import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  dark?: boolean;
};

export function Logo({ className, dark }: Props) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-baseline gap-2 no-underline", className)}
      aria-label="KEY — The Spark Index, inicio"
    >
      <span
        className={cn(
          "display text-2xl font-black leading-none tracking-tight sm:text-[1.7rem]",
          dark ? "text-white" : "text-key-ink"
        )}
      >
        KEY<span className="text-key-primary">.</span>
      </span>
      <span
        className={cn(
          "hand text-lg leading-none -rotate-3",
          dark ? "text-key-lime" : "text-key-primary"
        )}
      >
        The Spark Index
      </span>
    </Link>
  );
}

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
          "text-lg leading-none font-bold tracking-tight",
          dark ? "text-key-primary" : "text-key-primary"
        )}
      >
        The Spark Index
      </span>
    </Link>
  );
}

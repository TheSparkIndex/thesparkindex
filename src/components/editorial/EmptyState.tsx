import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  message,
  children,
  className,
}: {
  title: string;
  message?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border-2 border-dashed border-key-border bg-key-surface-alt px-6 py-16 text-center",
        className
      )}
    >
      <div className="bg-dotgrid pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-sm">
        <span className="stamp mb-4 inline-flex bg-key-lime text-key-ink">KEY</span>
        <Sparkles className="mx-auto mb-3 size-6 text-key-primary" aria-hidden />
        <h2 className="display text-2xl text-key-ink">{title}</h2>
        {message && <p className="mt-2 text-sm leading-6 text-key-muted">{message}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}

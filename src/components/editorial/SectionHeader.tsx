import { getSection } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SectionHeader({
  sectionSlug,
  title,
  description,
  color,
  count,
  className,
}: {
  sectionSlug: string;
  title?: string;
  description?: string;
  color?: string;
  count?: number;
  className?: string;
}) {
  const meta = getSection(sectionSlug);
  const resolvedColor = color ?? meta?.color ?? "#026DFD";
  const resolvedTitle = title ?? meta?.label ?? sectionSlug;
  const resolvedDescription = description ?? meta?.description;

  return (
    <header className={cn("relative overflow-hidden", className)}>
      <div className="bg-coord absolute inset-0 opacity-40" aria-hidden />
      <div className="container-key relative py-10 sm:py-14">
        <div className="max-w-2xl">
          <h1
            className="display mt-2 text-4xl sm:text-5xl lg:text-6xl"
            style={{ color: resolvedColor }}
          >
            {resolvedTitle}
          </h1>
          {resolvedDescription && (
            <p className="mt-3 max-w-xl text-base leading-7 text-key-muted">{resolvedDescription}</p>
          )}
          {typeof count === "number" && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-key-ink px-3 py-1 text-xs font-bold text-white">
              {count} {count === 1 ? "historia" : "historias"}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

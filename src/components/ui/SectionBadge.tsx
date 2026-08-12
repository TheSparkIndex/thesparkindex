import { getSection } from "@/lib/site";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = {
  sectionSlug?: string | null;
  color?: string;
  className?: string;
  small?: boolean;
  children?: React.ReactNode;
};

export function SectionBadge({ sectionSlug, color, className, small, children }: Props) {
  const section = sectionSlug ? getSection(sectionSlug) : undefined;
  const resolvedColor = color ?? section?.color ?? "#026DFD";

  const label = children ?? section?.shortLabel ?? "Key";
  const href = sectionSlug ? `/${sectionSlug}` : undefined;

  const body = (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-extrabold uppercase tracking-wider text-white shadow-sm",
        small ? "px-1.5 py-0.5 text-[0.6rem]" : "px-2.5 py-1 text-[0.68rem]",
        className
      )}
      style={{ backgroundColor: resolvedColor }}
    >
      {label}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-85 transition-opacity">
        {body}
      </Link>
    );
  }
  return body;
}

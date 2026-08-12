import { db } from "@/lib/db";
import { MediaLibrary, type MediaRow } from "@/components/admin/MediaLibrary";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminMediaPage() {
  const media = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  return (
    <div>
      <PageHeader
        title="Biblioteca de medios"
        subtitle={`${media.length} archivos en total. JPG, PNG, WebP, AVIF, GIF y SVG.`}
      />
      <MediaLibrary initial={media as unknown as MediaRow[]} />
    </div>
  );
}

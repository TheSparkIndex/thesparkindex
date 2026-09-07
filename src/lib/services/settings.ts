import { db } from "@/lib/db";

export type SiteSettings = {
  siteName: string | null;
  tagline: string | null;
  description: string | null;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  bannerArticleSlug: string | null;
  bannerEnabled: boolean;
  bannerBgColor: string | null;
  bannerTextColor: string | null;
  bannerButtonBgColor: string | null;
  bannerButtonTextColor: string | null;
  footerCopyright: string | null;
};

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    siteName: str(map.get("siteName")),
    tagline: str(map.get("tagline")),
    description: str(map.get("description")),
    instagram: str(map.get("instagram")),
    tiktok: str(map.get("tiktok")),
    twitter: str(map.get("twitter")),
    bannerTitle: str(map.get("bannerTitle")),
    bannerSubtitle: str(map.get("bannerSubtitle")),
    bannerArticleSlug: str(map.get("bannerArticleSlug")),
    bannerEnabled: map.get("bannerEnabled") === true || map.get("bannerEnabled") === "true",
    bannerBgColor: str(map.get("bannerBgColor")),
    bannerTextColor: str(map.get("bannerTextColor")),
    bannerButtonBgColor: str(map.get("bannerButtonBgColor")),
    bannerButtonTextColor: str(map.get("bannerButtonTextColor")),
    footerCopyright: str(map.get("footerCopyright")),
  };
}

export async function getSettingsMap(): Promise<Record<string, unknown>> {
  const rows = await db.setting.findMany();
  const map: Record<string, unknown> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

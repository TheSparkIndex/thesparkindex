import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiToken } from "@/lib/content-api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireApiToken(req);
  if (denied) return denied;

  const sections = await db.section.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, description: true, isActive: true },
  });
  return NextResponse.json({ sections });
}

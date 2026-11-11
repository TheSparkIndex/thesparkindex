import { NextResponse } from "next/server";
import { requireApiToken } from "@/lib/content-api/auth";
import { listSections } from "@/lib/content-api/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireApiToken(req);
  if (denied) return denied;
  return NextResponse.json({ sections: await listSections() });
}

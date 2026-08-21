import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const RATE_LIMIT_MS = 60_000;
const recentHits = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const path = typeof body.path === "string" ? body.path : "/";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const key = `${ip}:${path}`;
    const now = Date.now();
    const last = recentHits.get(key) ?? 0;
    if (now - last < RATE_LIMIT_MS) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    recentHits.set(key, now);
    if (recentHits.size > 5000) {
      for (const [k, v] of recentHits) {
        if (now - v > RATE_LIMIT_MS * 5) recentHits.delete(k);
      }
    }

    await db.pageView.create({ data: { path } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

import { storage } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";

const MIME: Record<string, string> = {
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const key = path.join("/");
  const file = await storage.get(key);

  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = key.includes(".") ? `.${key.split(".").pop()}` : "";
  const contentType = file.contentType ?? MIME[ext.toLowerCase()] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

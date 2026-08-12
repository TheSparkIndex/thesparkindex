import { db } from "@/lib/db";

type JsonValue = unknown;

export async function getSetting(key: string): Promise<JsonValue | null> {
  const row = await db.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getSettingsMap(): Promise<Record<string, JsonValue>> {
  const rows = await db.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

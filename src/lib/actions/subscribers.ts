"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";

const subscribeSchema = z.object({
  email: z.string().email("Correo inválido."),
  name: z.string().optional(),
});

export async function subscribeEmail(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const raw = {
    email: ((formData.get("email") as string) ?? "").trim().toLowerCase(),
    name: ((formData.get("name") as string) ?? "").trim() || undefined,
  };

  const parsed = subscribeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const existing = await db.subscriber.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    if (existing.isActive) {
      return { error: "Este correo ya está suscrito." };
    }
    await db.subscriber.update({
      where: { id: existing.id },
      data: { isActive: true, name: parsed.data.name ?? existing.name },
    });
    revalidatePath("/");
    return { ok: true };
  }

  await db.subscriber.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
    },
  });
  revalidatePath("/");
  return { ok: true };
}

export async function unsubscribeEmail(
  email: string
): Promise<{ ok?: boolean; error?: string }> {
  const sub = await db.subscriber.findUnique({ where: { email } });
  if (!sub) return { error: "Correo no encontrado." };
  await db.subscriber.update({
    where: { id: sub.id },
    data: { isActive: false },
  });
  revalidatePath("/");
  return { ok: true };
}

export async function deleteSubscriber(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  await db.subscriber.delete({ where: { id } });
  revalidatePath("/admin/suscriptores");
  return {};
}

export async function getSubscriberStats() {
  const [total, active] = await Promise.all([
    db.subscriber.count(),
    db.subscriber.count({ where: { isActive: true } }),
  ]);
  return { total, active };
}

export async function listSubscribers(page = 1, perPage = 50) {
  const safePage = Math.max(1, page);
  const [items, total] = await Promise.all([
    db.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * perPage,
      take: perPage,
      select: { id: true, email: true, name: true, isActive: true, createdAt: true },
    }),
    db.subscriber.count(),
  ]);
  return {
    items,
    total,
    page: safePage,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function exportSubscribersCSV(): Promise<string> {
  const subs = await db.subscriber.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: { email: true, name: true, createdAt: true },
  });
  const header = "email,name,subscribedAt";
  const rows = subs.map(
    (s) => `${s.email},${s.name ?? ""},${s.createdAt.toISOString()}`
  );
  return [header, ...rows].join("\n");
}

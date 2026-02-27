"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserFromCookie } from "@/lib/auth";

const eventSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  city: z.string().min(2).max(80),
  location: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
  startAt: z.string().min(10),
  endAt: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const ticketSchema = z.object({
  name: z.string().min(2).max(60),
  priceUah: z.string().regex(/^\d+(\.\d{1,2})?$/),
  quantityTotal: z.string().regex(/^\d+$/),
});

async function requireOrganizer() {
  const me = await getCurrentUserFromCookie();
  if (!me) redirect("/login?next=/admin");
  if (me.role !== "ORGANIZER" && me.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return me;
}

export async function createEventAction(formData: FormData) {
  const me = await requireOrganizer();

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    city: formData.get("city"),
    location: formData.get("location"),
    category: formData.get("category"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    imageUrl: formData.get("imageUrl"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Некоректні дані форми" };
  }

  const startAt = new Date(parsed.data.startAt);
  const endAt = parsed.data.endAt ? new Date(parsed.data.endAt) : null;
  if (isNaN(startAt.getTime())) return { ok: false, error: "Некоректна дата старту" };
  if (endAt && isNaN(endAt.getTime())) return { ok: false, error: "Некоректна дата завершення" };

  await prisma.event.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      city: parsed.data.city,
      location: parsed.data.location,
      category: parsed.data.category,
      startAt,
      endAt,
      imageUrl: parsed.data.imageUrl || null,
      organizerId: me.sub,
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function createTicketTypeAction(eventId: string, formData: FormData) {
  const me = await requireOrganizer();

  const parsed = ticketSchema.safeParse({
    name: formData.get("name"),
    priceUah: formData.get("priceUah"),
    quantityTotal: formData.get("quantityTotal"),
  });

  if (!parsed.success) return { ok: false, error: "Некоректні дані квитка" };

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
  if (!event) return { ok: false, error: "Подію не знайдено" };
  if (me.role !== "ADMIN" && event.organizerId !== me.sub) return { ok: false, error: "Недостатньо прав" };

  const price = Math.round(Number(parsed.data.priceUah) * 100);
  const quantityTotal = Number(parsed.data.quantityTotal);

  await prisma.ticketType.create({
    data: { eventId, name: parsed.data.name, price, quantityTotal },
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteEventAction(eventId: string) {
  const me = await requireOrganizer();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, ticketTypes: { select: { id: true } } },
  });
  if (!event) return { ok: false, error: "Подію не знайдено" };
  if (me.role !== "ADMIN" && event.organizerId !== me.sub) return { ok: false, error: "Недостатньо прав" };

  const ticketTypeIds = event.ticketTypes.map((t) => t.id);
  const used = await prisma.orderItem.count({ where: { ticketTypeId: { in: ticketTypeIds } } });
  if (used > 0) return { ok: false, error: "Неможливо видалити: є замовлення на квитки" };

  await prisma.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { eventId } });
    await tx.ticketType.deleteMany({ where: { eventId } });
    await tx.event.delete({ where: { id: eventId } });
  });

  revalidatePath("/admin");
  return { ok: true };
}

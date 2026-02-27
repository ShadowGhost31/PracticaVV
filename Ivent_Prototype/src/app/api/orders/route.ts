import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserFromCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const me = await getCurrentUserFromCookie();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ticketTypeId = String(body.ticketTypeId || "");
  const quantity = Number(body.quantity || 0);

  if (!ticketTypeId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tt = await tx.ticketType.findUnique({ where: { id: ticketTypeId }, include: { event: true } });
      if (!tt) return { kind: "not_found" as const };

      const available = tt.quantityTotal - tt.quantitySold;
      if (quantity > available) return { kind: "not_enough" as const };

      const unitPrice = tt.price;
      const total = unitPrice * quantity;

      const order = await tx.order.create({
        data: {
          userId: me.sub,
          status: "CREATED",
          total,
          items: { create: [{ ticketTypeId: tt.id, quantity, unitPrice }] },
        },
        include: { items: true },
      });

      await tx.ticketType.update({
        where: { id: tt.id },
        data: { quantitySold: { increment: quantity } },
      });

      return { kind: "ok" as const, orderId: order.id, total: order.total, eventId: tt.eventId };
    });

    if (result.kind === "not_found") return NextResponse.json({ error: "Квиток не знайдено" }, { status: 404 });
    if (result.kind === "not_enough") return NextResponse.json({ error: "Недостатньо квитків" }, { status: 409 });

    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
  }
}

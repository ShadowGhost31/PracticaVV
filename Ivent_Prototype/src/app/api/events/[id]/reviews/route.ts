import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserFromCookie } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentUserFromCookie();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rating = Number(body.rating);
  const text = String(body.text || "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || text.length < 3) {
    return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
  }

  try {
    const review = await prisma.review.create({
      data: { eventId: params.id, userId: me.sub, rating, text },
    });
    return NextResponse.json(review);
  } catch {
    return NextResponse.json({ error: "Ви вже залишали відгук" }, { status: 409 });
  }
}

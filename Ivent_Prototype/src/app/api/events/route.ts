import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserFromCookie } from "@/lib/auth";

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { startAt: "asc" },
    include: { ticketTypes: true, reviews: true },
  });

  const mapped = events.map((e) => {
    const avg =
      e.reviews.length === 0 ? 0 : e.reviews.reduce((s, r) => s + r.rating, 0) / e.reviews.length;
    return { ...e, avgRating: Number(avg.toFixed(2)) };
  });

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const me = await getCurrentUserFromCookie();
  if (!me || (me.role !== "ORGANIZER" && me.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const city = String(body.city || "").trim();
  const location = String(body.location || "").trim();
  const category = String(body.category || "").trim();
  const startAt = new Date(body.startAt);
  const imageUrl = body.imageUrl ? String(body.imageUrl) : null;

  if (!title || !description || !city || !location || !category || isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      city,
      location,
      category,
      startAt,
      imageUrl,
      organizerId: me.sub,
    },
  });

  return NextResponse.json(event);
}

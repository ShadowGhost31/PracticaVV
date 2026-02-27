import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      ticketTypes: true,
      organizer: { select: { id: true, name: true, email: true } },
      reviews: { include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const avg =
    event.reviews.length === 0 ? 0 : event.reviews.reduce((s, r) => s + r.rating, 0) / event.reviews.length;

  return NextResponse.json({ ...event, avgRating: Number(avg.toFixed(2)) });
}

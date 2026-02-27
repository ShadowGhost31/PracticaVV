import Image from "next/image";
import { prisma } from "@/lib/db";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import { formatDateTime } from "@/lib/utils";
import BuyTicketForm from "./ui/BuyTicketForm";
import ReviewForm from "./ui/ReviewForm";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      ticketTypes: true,
      organizer: { select: { id: true, name: true, email: true } },
      reviews: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) return <div className="text-slate-200">Подію не знайдено.</div>;

  const avg =
    event.reviews.length === 0 ? 0 : event.reviews.reduce((s, r) => s + r.rating, 0) / event.reviews.length;

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-4 p-5 md:grid-cols-[260px_1fr]">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {event.imageUrl ? (
              <Image
                src={event.imageUrl}
                alt={event.title}
                width={1200}
                height={800}
                className="h-[220px] w-full object-cover md:h-full"
                unoptimized
              />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-slate-400 md:h-full">
                Немає зображення
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>

            <div className="flex flex-wrap gap-2">
              <Badge>{formatDateTime(event.startAt)}</Badge>
              <Badge>{event.city}, {event.location}</Badge>
              <Badge>{event.category}</Badge>
              <Badge>Рейтинг: {Number(avg.toFixed(2))}</Badge>
            </div>

            <div className="text-sm text-slate-300">
              Організатор: {event.organizer?.name || event.organizer?.email}
            </div>

            <div className="text-slate-100/95 whitespace-pre-wrap">{event.description}</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-5">
            <h2 className="text-lg font-semibold">Квитки</h2>
            <p className="text-sm text-slate-300 mt-1">
              У прототипі оплата не інтегрована — замовлення лише фіксується в БД.
            </p>
            <BuyTicketForm ticketTypes={event.ticketTypes} />
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <h2 className="text-lg font-semibold">Залишити відгук</h2>
            <p className="text-sm text-slate-300 mt-1">
              Відгуки можуть залишати лише авторизовані користувачі.
            </p>
            <ReviewForm eventId={event.id} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-5">
          <h2 className="text-lg font-semibold">Відгуки</h2>
          <div className="mt-3 space-y-3">
            {event.reviews.length === 0 && <div className="text-slate-300">Поки немає відгуків.</div>}
            {event.reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-slate-300">
                  {r.user?.name || r.user?.email} • Оцінка: {r.rating} • {formatDateTime(r.createdAt)}
                </div>
                <div className="mt-2">{r.text}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

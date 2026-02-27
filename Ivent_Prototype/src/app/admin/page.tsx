import Link from "next/link";
import { redirect } from "next/navigation";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import { prisma } from "@/lib/db";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { createEventAction, createTicketTypeAction, deleteEventAction } from "./actions";

export const dynamic = "force-dynamic";

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      {desc && <p className="text-sm text-slate-300">{desc}</p>}
    </div>
  );
}

export default async function AdminPage() {
  const me = await getCurrentUserFromCookie();
  if (!me) redirect("/login?next=/admin");
  if (me.role !== "ORGANIZER" && me.role !== "ADMIN") {
    return (
      <Card>
        <div className="p-5">
          <h1 className="text-xl font-semibold">Доступ заборонено</h1>
          <p className="text-slate-300 mt-2">
            Панель доступна лише для ролей ORGANIZER або ADMIN.
          </p>
          <Link href="/" className="inline-block mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition">
            Повернутися на головну
          </Link>
        </div>
      </Card>
    );
  }

  const events = await prisma.event.findMany({
    where: me.role === "ADMIN" ? {} : { organizerId: me.sub },
    orderBy: { startAt: "asc" },
    include: { ticketTypes: true, reviews: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Панель організатора</h1>
          <p className="text-sm text-slate-300 mt-1">
            Створення подій, додавання квитків та керування власними івентами.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>Роль: {me.role}</Badge>
          <Link href="/calendar" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition">
            Переглянути календар
          </Link>
        </div>
      </div>

      <Card>
        <div className="p-5 space-y-4">
          <SectionTitle title="Створити нову подію" desc="Мінімальний набір полів для прототипу. Дату/час зручно вводити через datetime-local." />

          <form action={createEventAction} className="grid gap-3 md:grid-cols-2">
            <input name="title" placeholder="Назва події" className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60 md:col-span-2" />
            <textarea name="description" placeholder="Опис" rows={4} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60 md:col-span-2" />
            <input name="city" placeholder="Місто" className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60" />
            <input name="location" placeholder="Локація (адреса/місце)" className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60" />
            <input name="category" placeholder="Категорія" className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60" />
            <input name="imageUrl" placeholder="URL зображення (необов'язково)" className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60" />

            <div>
              <label className="text-xs text-slate-400">Початок</label>
              <input type="datetime-local" name="startAt" className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60" />
            </div>

            <div>
              <label className="text-xs text-slate-400">Завершення (опц.)</label>
              <input type="datetime-local" name="endAt" className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60" />
            </div>

            <button className="md:col-span-2 rounded-xl bg-sky-500/90 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition">
              Створити подію
            </button>

            <div className="md:col-span-2 text-xs text-slate-400">
              Примітка: якщо форма поверне помилку валідації, просто перевір поля (довжина/формат URL/дата).
            </div>
          </form>
        </div>
      </Card>

      <Card>
        <div className="p-5 space-y-4">
          <SectionTitle title="Мої події" desc="Список подій. Можна додати типи квитків або (за відсутності замовлень) видалити подію." />

          {events.length === 0 && <div className="text-slate-300">Подій ще немає. Створи першу подію вище.</div>}

          <div className="grid gap-4">
            {events.map((e) => {
              const avg = e.reviews.length ? e.reviews.reduce((s, r) => s + r.rating, 0) / e.reviews.length : 0;
              return (
                <div key={e.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <Link href={`/events/${e.id}`} className="text-lg font-semibold hover:text-sky-300 transition">
                        {e.title}
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{formatDateTime(e.startAt)}</Badge>
                        <Badge>{e.city}, {e.location}</Badge>
                        <Badge>{e.category}</Badge>
                        <Badge>Рейтинг: {Number(avg.toFixed(2))}</Badge>
                      </div>
                      <div className="text-sm text-slate-300 line-clamp-2">{e.description}</div>
                    </div>

                    <form action={async () => { "use server"; await deleteEventAction(e.id); }} className="shrink-0">
                      <button className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 hover:bg-rose-500/15 transition">
                        Видалити подію
                      </button>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Видалення доступне лише якщо немає замовлень
                      </div>
                    </form>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                      <div className="text-sm font-semibold">Квитки</div>
                      <div className="mt-2 space-y-2">
                        {e.ticketTypes.length === 0 && <div className="text-sm text-slate-300">Типів квитків ще немає.</div>}
                        {e.ticketTypes.map((t) => {
                          const available = t.quantityTotal - t.quantitySold;
                          return (
                            <div key={t.id} className="flex items-center justify-between text-sm">
                              <div>
                                {t.name} • {(t.price / 100).toFixed(2)} грн
                                <div className="text-xs text-slate-400">
                                  Доступно: {available} / {t.quantityTotal}
                                </div>
                              </div>
                              <Badge>продано {t.quantitySold}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                      <div className="text-sm font-semibold">Додати тип квитка</div>
                      <form action={async (fd) => { "use server"; await createTicketTypeAction(e.id, fd); }} className="mt-2 space-y-2">
                        <input name="name" placeholder="Назва (наприклад, Стандарт)" className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60" />
                        <div className="grid grid-cols-2 gap-2">
                          <input name="priceUah" placeholder="Ціна (грн), напр. 200" className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60" />
                          <input name="quantityTotal" placeholder="К-сть, напр. 100" className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60" />
                        </div>
                        <button className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15 transition">
                          Додати квиток
                        </button>
                        <div className="text-[11px] text-slate-400">
                          Ціна зберігається у копійках, але вводиться в гривнях.
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-400">
            Якщо ти зайшов як ADMIN — бачиш усі події. Якщо ORGANIZER — лише власні.
          </div>
        </div>
      </Card>
    </div>
  );
}

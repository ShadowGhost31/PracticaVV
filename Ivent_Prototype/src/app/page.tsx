import Link from "next/link";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function buildWhere(searchParams: Record<string, string | string[] | undefined>) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const category = typeof searchParams.category === "string" ? searchParams.category.trim() : "";
  const city = typeof searchParams.city === "string" ? searchParams.city.trim() : "";

  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) where.category = { equals: category, mode: "insensitive" };
  if (city) where.city = { equals: city, mode: "insensitive" };
  return { where, q, category, city };
}

export default async function HomePage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { where, q, category, city } = buildWhere(searchParams);

  const events = await prisma.event.findMany({
    where,
    orderBy: { startAt: "asc" },
    include: { reviews: true, ticketTypes: true },
  });

  const categories = Array.from(new Set((await prisma.event.findMany({ select: { category: true } })).map(x => x.category))).sort();
  const cities = Array.from(new Set((await prisma.event.findMany({ select: { city: true } })).map(x => x.city))).sort();

  const mapped = events.map((e) => {
    const avg = e.reviews.length ? e.reviews.reduce((s, r) => s + r.rating, 0) / e.reviews.length : 0;
    const minPrice = e.ticketTypes.length ? Math.min(...e.ticketTypes.map(t => t.price)) : 0;
    return { ...e, avgRating: Number(avg.toFixed(2)), minPrice };
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Каталог подій</h1>
        <p className="text-slate-300 text-sm">
          Пошук, фільтри, календар та бронювання квитків — прототип для практики.
        </p>
      </div>

      <Card>
        <div className="p-4 md:p-5">
          <form className="grid gap-3 md:grid-cols-4" action="/" method="get">
            <input
              name="q"
              defaultValue={q}
              placeholder="Пошук (назва/опис/локація)"
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60"
            />
            <select
              name="city"
              defaultValue={city}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60"
            >
              <option value="">Місто (усі)</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              name="category"
              defaultValue={category}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60"
            >
              <option value="">Категорія (усі)</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button className="flex-1 rounded-xl bg-sky-500/90 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 transition">
                Застосувати
              </button>
              <Link
                href="/"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
              >
                Скинути
              </Link>
            </div>
          </form>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {mapped.map((e) => (
          <Link key={e.id} href={`/events/${e.id}`} className="group">
            <Card>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="text-lg font-semibold group-hover:text-sky-300 transition">
                      {e.title}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{formatDateTime(e.startAt)}</Badge>
                      <Badge>{e.city}, {e.location}</Badge>
                      <Badge>{e.category}</Badge>
                      {e.minPrice ? <Badge>від {e.minPrice / 100} грн</Badge> : <Badge>квитків немає</Badge>}
                    </div>
                    <div className="text-sm text-slate-300 line-clamp-2">{e.description}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Рейтинг</div>
                    <div className="text-lg font-semibold">{e.avgRating}</div>
                    <div className="text-xs text-slate-400">{e.reviews.length} відгуків</div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {mapped.length === 0 && (
        <div className="text-slate-300">
          Нічого не знайдено. Спробуй інший пошук або скинь фільтри.
        </div>
      )}
    </div>
  );
}

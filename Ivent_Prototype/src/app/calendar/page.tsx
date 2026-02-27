import Link from "next/link";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import { prisma } from "@/lib/db";
import { formatDateTime, ym } from "@/lib/utils";

export const dynamic = "force-dynamic";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}
function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthLabel(date: Date) {
  return date.toLocaleDateString("uk-UA", { year: "numeric", month: "long" });
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const monthParam = typeof searchParams.month === "string" ? searchParams.month : "";
  const base = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? new Date(Number(monthParam.slice(0, 4)), Number(monthParam.slice(5, 7)) - 1, 1)
    : new Date();

  const monthStart = startOfMonth(base);
  const monthEnd = endOfMonth(base);

  const events = await prisma.event.findMany({
    where: { startAt: { gte: monthStart, lte: monthEnd } },
    orderBy: { startAt: "asc" },
    select: { id: true, title: true, startAt: true, city: true, category: true },
  });

  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const k = toKey(e.startAt);
    const list = byDay.get(k) ?? [];
    list.push(e);
    byDay.set(k, list);
  }

  // календарна сітка: початок тижня = Пн
  const firstDay = new Date(monthStart);
  const dow = (firstDay.getDay() + 6) % 7; // 0..6 (Пн..Нд)
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - dow);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }

  const prev = ym(addMonths(base, -1));
  const next = ym(addMonths(base, +1));
  const isToday = (d: Date) => {
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Календар подій</h1>
          <p className="text-sm text-slate-300 mt-1">
            Перегляд подій у форматі місяця. Клік по події відкриває сторінку івенту.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/calendar?month=${prev}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition">
            ← Попередній
          </Link>
          <Link href={`/calendar?month=${ym(new Date())}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition">
            Сьогодні
          </Link>
          <Link href={`/calendar?month=${next}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition">
            Наступний →
          </Link>
        </div>
      </div>

      <Card>
        <div className="p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">{monthLabel(base)}</div>
            <Badge>Подій у місяці: {events.length}</Badge>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-slate-300">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((x) => (
              <div key={x} className="px-2 py-1">{x}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {cells.map((d) => {
              const k = toKey(d);
              const list = byDay.get(k) || [];
              const inMonth = d.getMonth() === base.getMonth();
              const today = isToday(d);

              return (
                <div
                  key={k}
                  className={[
                    "min-h-[110px] rounded-2xl border p-2",
                    inMonth ? "border-white/10 bg-white/5" : "border-white/5 bg-white/3 opacity-60",
                    today ? "ring-1 ring-sky-400/50" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div className={today ? "text-sky-300 font-semibold" : "text-slate-200"}>
                      {d.getDate()}
                    </div>
                    {list.length > 0 && <span className="text-[10px] text-slate-400">{list.length}</span>}
                  </div>

                  <div className="mt-2 space-y-1">
                    {list.slice(0, 3).map((e) => (
                      <Link
                        key={e.id}
                        href={`/events/${e.id}`}
                        className="block truncate rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1 text-xs text-slate-100 hover:border-sky-400/40 hover:text-sky-200 transition"
                        title={`${e.title} • ${formatDateTime(e.startAt)}`}
                      >
                        {e.title}
                      </Link>
                    ))}
                    {list.length > 3 && (
                      <div className="text-[11px] text-slate-400">+{list.length - 3} ще</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

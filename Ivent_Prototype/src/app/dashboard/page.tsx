import Link from "next/link";
import { redirect } from "next/navigation";
import Card from "@/components/Card";
import { prisma } from "@/lib/db";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const me = await getCurrentUserFromCookie();
  if (!me) redirect("/login?next=/dashboard");

  const orders = await prisma.order.findMany({
    where: { userId: me.sub },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { ticketType: { include: { event: true } } } } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Кабінет</h1>
          <p className="text-sm text-slate-300 mt-1">Ваші замовлення квитків у прототипі.</p>
        </div>
        <Link href="/calendar" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition">
          Перейти в календар
        </Link>
      </div>

      <Card>
        <div className="p-5">
          <div className="text-sm text-slate-300">Ви: {me.email} • Роль: {me.role}</div>
        </div>
      </Card>

      <Card>
        <div className="p-5">
          <h2 className="text-lg font-semibold">Мої замовлення</h2>
          <div className="mt-3 space-y-3">
            {orders.length === 0 && <div className="text-slate-300">Замовлень ще немає.</div>}
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-slate-300">
                  {formatDateTime(o.createdAt)} • Статус: {o.status} • Сума: {(o.total / 100).toFixed(2)} грн
                </div>
                <ul className="mt-2 text-sm text-slate-100">
                  {o.items.map((it) => (
                    <li key={it.id}>
                      <Link href={`/events/${it.ticketType.event.id}`} className="hover:text-sky-300 transition">
                        {it.ticketType.event.title}
                      </Link>{" "}
                      — {it.ticketType.name} ×{it.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

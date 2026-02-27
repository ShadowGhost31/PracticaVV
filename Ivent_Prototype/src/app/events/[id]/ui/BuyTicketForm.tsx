"use client";

import { useMemo, useState } from "react";

type TicketType = {
  id: string;
  name: string;
  price: number;
  quantityTotal: number;
  quantitySold: number;
};

export default function BuyTicketForm({ ticketTypes }: { ticketTypes: TicketType[] }) {
  const initial = ticketTypes?.[0]?.id || "";
  const [ticketTypeId, setTicketTypeId] = useState(initial);
  const [quantity, setQuantity] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => ticketTypes.find((t) => t.id === ticketTypeId) || null,
    [ticketTypes, ticketTypeId]
  );

  async function submit() {
    setMsg(null);
    setLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketTypeId, quantity }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) setMsg(data.error || "Помилка");
    else setMsg(`Замовлення створено. Сума: ${(data.total / 100).toFixed(2)} грн`);
  }

  const available = selected ? selected.quantityTotal - selected.quantitySold : 0;

  return (
    <div className="mt-4 space-y-3">
      {ticketTypes.length === 0 ? (
        <div className="text-slate-300">Квитків поки що немає.</div>
      ) : (
        <>
          <label className="text-xs text-slate-400">Тип квитка</label>
          <select
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60"
            value={ticketTypeId}
            onChange={(e) => setTicketTypeId(e.target.value)}
          >
            {ticketTypes.map((t) => {
              const a = t.quantityTotal - t.quantitySold;
              return (
                <option key={t.id} value={t.id}>
                  {t.name} — {(t.price / 100).toFixed(2)} грн (доступно {a})
                </option>
              );
            })}
          </select>

          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">Кількість (1–10)</label>
              <input
                type="number"
                min={1}
                max={10}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className="flex items-end">
              <div className="text-sm text-slate-300">
                Доступно: <span className="font-semibold text-white">{available}</span>
              </div>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading || !ticketTypeId}
            className="w-full rounded-xl bg-sky-500/90 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition disabled:opacity-50"
          >
            {loading ? "Оформлення..." : "Оформити замовлення"}
          </button>
        </>
      )}

      {msg && <div className="text-sm text-slate-200">{msg}</div>}
    </div>
  );
}

"use client";

import { useState } from "react";

export default function ReviewForm({ eventId }: { eventId: string }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMsg(null);
    setLoading(true);

    const res = await fetch(`/api/events/${eventId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, text }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) setMsg(data.error || "Помилка");
    else setMsg("Відгук додано. Онови сторінку, щоб побачити його.");
  }

  return (
    <div className="mt-4 space-y-3">
      <label className="text-xs text-slate-400">Оцінка</label>
      <select
        className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60"
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
      >
        {[5, 4, 3, 2, 1].map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>

      <label className="text-xs text-slate-400">Текст</label>
      <textarea
        className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ваш відгук..."
      />

      <button
        onClick={submit}
        disabled={loading}
        className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition disabled:opacity-50"
      >
        {loading ? "Надсилання..." : "Надіслати"}
      </button>

      {msg && <div className="text-sm text-slate-200">{msg}</div>}
    </div>
  );
}

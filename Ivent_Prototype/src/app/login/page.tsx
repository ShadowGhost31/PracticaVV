"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/Card";

export default function LoginPage() {
  const r = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const [email, setEmail] = useState("user@demo.com");
  const [password, setPassword] = useState("user123");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMsg(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) setMsg(data.error || "Помилка");
    else {
      r.push(next);
      r.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Вхід</h1>
        <p className="text-sm text-slate-300 mt-1">Увійди, щоб залишати відгуки та оформлювати квитки.</p>
      </div>

      <Card>
        <div className="p-5 space-y-3">
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-sky-400/60"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
          />

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl bg-sky-500/90 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition disabled:opacity-50"
          >
            {loading ? "Вхід..." : "Увійти"}
          </button>

          {msg && <div className="text-sm text-rose-200">{msg}</div>}

          <div className="text-xs text-slate-400">
            Тестові акаунти (seed): user@demo.com / user123; organizer@demo.com / organizer123; admin@demo.com / admin123
          </div>
        </div>
      </Card>
    </div>
  );
}

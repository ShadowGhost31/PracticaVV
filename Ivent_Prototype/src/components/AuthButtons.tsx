"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthButtons({ isAuthed }: { isAuthed: boolean }) {
  const r = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    r.push("/login");
    r.refresh();
    setLoading(false);
  }

  if (!isAuthed) return null;

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15 transition disabled:opacity-50"
    >
      Вийти
    </button>
  );
}

import "./globals.css";
import Link from "next/link";
import { getCurrentUserFromCookie } from "@/lib/auth";
import AuthButtons from "@/components/AuthButtons";

export const metadata = {
  title: "CityEvents (прототип)",
  description: "Сайт івентів міста — прототип для практики",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-sm text-slate-200 hover:text-white hover:bg-white/10 transition"
    >
      {children}
    </Link>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUserFromCookie();

  return (
    <html lang="uk">
      <body className="min-h-screen text-slate-100">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="font-semibold tracking-tight">
                CityEvents <span className="text-slate-400">(прототип)</span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                <NavLink href="/">Події</NavLink>
                <NavLink href="/calendar">Календар</NavLink>
                <NavLink href="/dashboard">Кабінет</NavLink>
                <NavLink href="/admin">Панель</NavLink>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {me ? (
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-300">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    {me.email} • {me.role}
                  </span>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg bg-sky-500/90 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400 transition"
                >
                  Увійти
                </Link>
              )}

              <AuthButtons isAuthed={!!me} />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        <footer className="border-t border-white/10 py-6">
          <div className="mx-auto max-w-6xl px-4 text-sm text-slate-400">
            © {new Date().getFullYear()} CityEvents • Next.js + Prisma + PostgreSQL
          </div>
        </footer>
      </body>
    </html>
  );
}

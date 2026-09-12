"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, LayoutDashboard, Package, RefreshCw, ShoppingCart } from "lucide-react";
import { toFa } from "@/lib/fa";
import { site } from "@/lib/site";
import { useStore } from "../store";

const LINKS = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart },
];

/** Two-step button: the first press arms it, the second within 3s confirms. No window.confirm — it is blocked in some in-app browsers. */
export function useConfirm() {
  const [armed, setArmed] = useState<string | null>(null);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(null), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);
  return {
    armed,
    ask: (key: string, action: () => void) => {
      if (armed === key) {
        setArmed(null);
        action();
      } else setArmed(key);
    },
  };
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, orders, resetDemo } = useStore();
  const { armed, ask } = useConfirm();
  const pending = ready ? orders.filter((o) => o.status === "pending").length : 0;

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-40 bg-ink text-[#e9e6dc] lg:flex lg:h-dvh lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:py-6">
          <Link href="/admin" className="text-xl font-black text-white">
            {site.name}
            <span className="text-[#d98b83]">.</span>
            <span className="ms-2 align-middle text-xs font-semibold text-[#b9b5a8]">پنل مدیریت</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white lg:hidden">
            <ExternalLink className="size-3.5" /> فروشگاه
          </Link>
        </div>

        <nav aria-label="منوی پنل" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const on = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-sm px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  on ? "bg-white/12 text-white" : "text-[#b9b5a8] hover:bg-white/6 hover:text-white"
                }`}
              >
                <Icon className="size-[18px]" strokeWidth={1.8} />
                {label}
                {href === "/admin/orders" && pending > 0 && (
                  <span className="ms-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#d98b83] px-1.5 text-[0.7rem] font-bold text-ink">
                    {toFa(pending)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden space-y-2 border-t border-white/10 p-4 lg:block">
          <Link href="/" className="flex items-center gap-2 rounded-sm px-2 py-2 text-sm text-[#b9b5a8] hover:text-white">
            <ExternalLink className="size-4" /> مشاهده فروشگاه
          </Link>
          <button
            type="button"
            onClick={() => ask("reset", resetDemo)}
            className={`flex w-full items-center gap-2 rounded-sm px-2 py-2 text-start text-sm transition-colors ${
              armed === "reset" ? "bg-[#d98b83] font-bold text-ink" : "text-[#b9b5a8] hover:text-white"
            }`}
          >
            <RefreshCw className="size-4" />
            {armed === "reset" ? "دوباره بزنید تا بازنشانی شود" : "بازنشانی داده‌های نمایشی"}
          </button>
          <p className="px-2 pt-2 text-[0.7rem] leading-5 text-[#8f8b80]">
            در این نسخه‌ی نمایشی ورود به پنل بدون رمز است و داده‌ها فقط در همین مرورگر ذخیره می‌شوند.
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-8 lg:py-10">{children}</main>
        <div className="px-4 pb-8 lg:hidden">
          <button
            type="button"
            onClick={() => ask("reset", resetDemo)}
            className={`flex w-full items-center justify-center gap-2 rounded-sm border px-3 py-3 text-sm font-semibold ${
              armed === "reset" ? "border-accent bg-accent text-white" : "border-line-strong text-ink-soft"
            }`}
          >
            <RefreshCw className="size-4" />
            {armed === "reset" ? "دوباره بزنید تا بازنشانی شود" : "بازنشانی داده‌های نمایشی"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-[1.7rem]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

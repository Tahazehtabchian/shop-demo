"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { toFa } from "@/lib/fa";
import { site } from "@/lib/site";
import { useStore } from "../store";
import { btn } from "../ui";

const NAV = [
  { href: "/shop", label: "همه محصولات", key: "all" },
  ...CATEGORIES.map((c) => ({ href: `/shop?cat=${c.id}`, label: c.label, key: c.id as string })),
  { href: "/shop?sale=1", label: "تخفیف‌ها", key: "sale" },
  { href: "/track", label: "پیگیری سفارش", key: "track" },
];

type NavProps = { vertical?: boolean; onNavigate?: () => void };

function NavLinks({ active, vertical, onNavigate }: NavProps & { active: string | null }) {
  return (
    <ul className={vertical ? "flex flex-col" : "flex items-center gap-0.5"}>
      {NAV.map((item) => {
        const on = active === item.key;
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={on ? "page" : undefined}
              className={
                vertical
                  ? `block border-b border-line py-3.5 text-[0.95rem] ${on ? "font-bold text-accent" : "text-ink"}`
                  : `rounded-sm px-3 py-2 text-[0.9rem] transition-colors hover:bg-accent-soft hover:text-ink ${
                      on ? "font-bold text-accent" : "text-ink-soft"
                    } ${item.key === "sale" ? "text-accent" : ""}`
              }
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function LiveNavLinks(props: NavProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  let active: string | null = null;
  if (pathname === "/shop") active = params.get("sale") ? "sale" : params.get("cat") ?? (params.get("q") ? null : "all");
  else if (pathname === "/track") active = "track";
  return <NavLinks active={active} {...props} />;
}

/** Search params need a Suspense boundary in a static export; the fallback is the same menu, unhighlighted. */
function Nav(props: NavProps) {
  return (
    <Suspense fallback={<NavLinks active={null} {...props} />}>
      <LiveNavLinks {...props} />
    </Suspense>
  );
}

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute end-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
      {toFa(n)}
    </span>
  );
}

export function Header() {
  const { ready, cartCount, wishlist, setCartOpen } = useStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setSearchOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <>
      <div className="bg-ink text-[0.78rem] text-[#e9e6dc]">
        <div className="wrap flex items-center justify-between gap-3 py-2">
          <p className="truncate">
            نسخه‌ی نمایشی فروشگاه — داده‌ها فقط در همین مرورگر ذخیره می‌شوند.
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-bg/92 backdrop-blur-md">
        <div className="wrap flex h-[68px] items-center justify-between gap-4 lg:h-[76px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`${btn.icon} lg:hidden`}
              aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((v) => !v);
                setSearchOpen(false);
              }}
            >
              {menuOpen ? <X className="size-[22px]" /> : <Menu className="size-[22px]" />}
            </button>
            <Link href="/" className="text-[1.6rem] font-black tracking-tight text-ink" onClick={() => setMenuOpen(false)}>
              {site.name}
              <span className="text-accent">.</span>
            </Link>
          </div>

          <nav aria-label="منوی اصلی" className="hidden lg:block">
            <Nav />
          </nav>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className={btn.icon}
              aria-label="جست‌وجو"
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((v) => !v);
                setMenuOpen(false);
              }}
            >
              <Search className="size-[21px]" strokeWidth={1.7} />
            </button>
            <Link href="/wishlist" className={btn.icon} aria-label="علاقه‌مندی‌ها">
              <Heart className="size-[21px]" strokeWidth={1.7} />
              <Badge n={ready ? wishlist.length : 0} />
            </Link>
            <button type="button" className={btn.icon} aria-label="سبد خرید" onClick={() => setCartOpen(true)}>
              <ShoppingBag className="size-[21px]" strokeWidth={1.7} />
              <Badge n={ready ? cartCount : 0} />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="animate-fade-in border-t border-line bg-bg">
            <form onSubmit={submitSearch} className="wrap flex gap-2 py-3" role="search">
              <input
                autoFocus
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="نام محصول، مثلاً هودی یا بوت"
                aria-label="عبارت جست‌وجو"
                className="field"
              />
              <button type="submit" className={btn.small}>
                جست‌وجو
              </button>
            </form>
          </div>
        )}

        {menuOpen && (
          <nav aria-label="منوی موبایل" className="animate-fade-in border-t border-line bg-surface lg:hidden">
            <div className="wrap pb-5">
              <Nav vertical onNavigate={() => setMenuOpen(false)} />
              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="block border-b border-line py-3.5 text-[0.95rem] text-ink"
              >
                علاقه‌مندی‌ها
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

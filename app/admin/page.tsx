"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Clock, PackageX, TrendingUp, Wallet } from "lucide-react";
import { PageHead } from "@/components/admin/shell";
import { SalesChart } from "@/components/admin/sales-chart";
import { useStore } from "@/components/store";
import { Skeleton, StatusBadge, Swatch } from "@/components/ui";
import { COLORS, ONE_SIZE, stockOf, totalStock } from "@/lib/catalog";
import { faDayMonth, faTime, toFa, toman, tomanShort } from "@/lib/fa";

const DAY = 86_400_000;

function Tile({
  label,
  value,
  icon: Icon,
  foot,
  href,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  foot?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        <Icon className="size-[18px] text-muted" strokeWidth={1.8} />
      </div>
      <p className="mt-2 text-[1.6rem] leading-tight font-extrabold">{value}</p>
      {foot && <div className="mt-1.5 text-xs text-muted">{foot}</div>}
    </>
  );
  const cls = "block rounded-sm border border-line bg-surface p-5 transition-colors";
  return href ? (
    <Link href={href} className={`${cls} hover:border-ink`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default function DashboardPage() {
  const { ready, orders, products } = useStore();
  // The dashboard's "now", fixed for the life of the page.
  const [now] = useState(Date.now);

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const live = orders.filter((o) => o.status !== "cancelled");
  const sumBetween = (from: number, to: number) =>
    live.filter((o) => o.createdAt >= from && o.createdAt < to).reduce((s, o) => s + o.total, 0);
  const week = sumBetween(now - 7 * DAY, now + 1);
  const prevWeek = sumBetween(now - 14 * DAY, now - 7 * DAY);
  const delta = prevWeek ? Math.round(((week - prevWeek) / prevWeek) * 100) : null;

  const startToday = new Date(now).setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => o.createdAt >= startToday).length;
  const pending = orders.filter((o) => o.status === "pending");

  const lowStock = products
    .map((p) => ({
      product: p,
      low: p.colors.flatMap((c) => p.sizes.map((s) => ({ color: c, size: s, n: stockOf(p, c, s) }))).filter((v) => v.n <= 2),
    }))
    .filter((x) => x.low.length)
    .sort((a, b) => totalStock(a.product) - totalStock(b.product));
  const soldOut = products.filter((p) => totalStock(p) === 0).length;

  const recent = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

  return (
    <>
      <PageHead
        title="داشبورد"
        // Composed by hand: Chrome's fa-IR weekday format uses a Latin comma that scrambles RTL order.
        sub={`${new Date(now).toLocaleDateString("fa-IR", { weekday: "long" })}، ${new Date(now).toLocaleDateString("fa-IR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile
          label="فروش ۷ روز اخیر"
          value={tomanShort(week)}
          icon={Wallet}
          foot={
            delta === null ? (
              "تومان"
            ) : (
              <span className={`inline-flex items-center gap-1 font-semibold ${delta >= 0 ? "text-olive" : "text-accent"}`}>
                {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                ٪{toFa(Math.abs(delta))} {delta >= 0 ? "بیشتر" : "کمتر"} از هفته‌ی قبل
              </span>
            )
          }
        />
        <Tile label="سفارش‌های امروز" value={toFa(todayOrders)} icon={TrendingUp} foot={`از ${toFa(orders.length)} سفارش کل`} />
        <Tile
          label="در انتظار تایید"
          value={toFa(pending.length)}
          icon={Clock}
          href="/admin/orders?status=pending"
          foot={pending.length ? "برای بررسی کلیک کنید" : "همه‌ی سفارش‌ها بررسی شده‌اند"}
        />
        <Tile
          label="کم‌موجود / ناموجود"
          value={toFa(lowStock.length)}
          icon={PackageX}
          href="/admin/products"
          foot={soldOut ? `${toFa(soldOut)} محصول کاملاً ناموجود` : "هیچ محصولی کاملاً تمام نشده"}
        />
      </div>

      <div className="mt-6">
        <SalesChart orders={orders} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-sm border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold">آخرین سفارش‌ها</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
              همه <ArrowLeft className="size-4" />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {recent.map((o) => (
              <li key={o.code}>
                <Link href={`/admin/orders?open=${o.code}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{o.customer.name}</p>
                    <p className="text-xs text-muted">
                      <span dir="ltr">{o.code}</span> · {faDayMonth(o.createdAt)} {faTime(o.createdAt)}
                    </p>
                  </div>
                  <span className="hidden text-sm font-semibold sm:block">{toman(o.total)}</span>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-sm border border-line bg-surface">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-bold">هشدار موجودی</h2>
            <p className="text-xs text-muted">تنوع‌هایی با ۲ عدد یا کمتر</p>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">موجودی همه‌ی محصولات کافی است.</p>
          ) : (
            <ul className="max-h-[26rem] divide-y divide-line overflow-y-auto">
              {lowStock.map(({ product, low }) => (
                <li key={product.id}>
                  <Link href={`/admin/products?edit=${product.id}`} className="flex gap-3 px-5 py-3.5 hover:bg-bg">
                    <img src={product.images[0]} alt="" className="h-12 w-10 shrink-0 rounded-sm bg-sunk object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{product.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {low.slice(0, 4).map((v) => (
                          <span
                            key={`${v.color}${v.size}`}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${
                              v.n === 0 ? "bg-sunk text-muted" : "bg-amber-soft text-amber"
                            }`}
                          >
                            <Swatch color={v.color} size={9} />
                            {COLORS[v.color]?.name}
                            {v.size !== ONE_SIZE && ` ${toFa(v.size)}`}: {v.n === 0 ? "تمام" : toFa(v.n)}
                          </span>
                        ))}
                        {low.length > 4 && <span className="text-[0.7rem] text-muted">+{toFa(low.length - 4)}</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

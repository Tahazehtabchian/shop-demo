"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink, MapPin, Phone, Search } from "lucide-react";
import { COLORS, ONE_SIZE, ORDER_STATUSES, type Order, type OrderStatus, PAYMENT_LABELS, statusLabel } from "@/lib/catalog";
import { faDayMonth, faTime, normalizeFa, toFa, toLatin, toman } from "@/lib/fa";
import { useStore } from "../store";
import { EmptyState, Skeleton, StatusBadge, btn } from "../ui";
import { PageHead, useConfirm } from "./shell";

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: "confirmed", label: "تایید سفارش" },
  confirmed: { to: "shipped", label: "ثبت ارسال" },
  shipped: { to: "delivered", label: "ثبت تحویل" },
};

export function OrdersAdmin() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, orders, setOrderStatus, toast } = useStore();
  const { armed, ask } = useConfirm();
  const [q, setQ] = useState("");
  const status = (params.get("status") as OrderStatus | null) ?? "all";
  const [open, setOpen] = useState<string | null>(params.get("open"));

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const list = useMemo(() => {
    const needle = normalizeFa(q);
    const digitsOnly = toLatin(q).replace(/\D/g, "");
    return [...orders]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((o) => status === "all" || o.status === status)
      .filter(
        (o) =>
          !needle ||
          normalizeFa(`${o.code} ${o.customer.name} ${o.customer.city}`).includes(needle) ||
          (digitsOnly.length >= 3 && (o.customer.phone.includes(digitsOnly) || o.code.includes(digitsOnly))),
      );
  }, [orders, status, q]);

  if (!ready) return <Skeleton className="h-96" />;

  const setStatusFilter = (s: string) => router.replace(s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`, { scroll: false });

  const change = (o: Order, to: OrderStatus) => {
    setOrderStatus(o.code, to);
    toast(`سفارش ${o.code}: ${statusLabel(to)}`);
  };

  return (
    <>
      <PageHead title="سفارش‌ها" sub="سفارش‌هایی که در فروشگاه ثبت کنید همین‌جا ظاهر می‌شوند." />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ id: "all", label: "همه" }, ...ORDER_STATUSES].map((s) => {
          const on = status === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter(s.id)}
              aria-pressed={on}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                on ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-soft hover:border-ink"
              }`}
            >
              {s.label}
              <span className={`text-xs ${on ? "text-[#cfcabd]" : "text-muted"}`}>{toFa(counts[s.id] ?? 0)}</span>
            </button>
          );
        })}
      </div>

      <div className="relative mb-5 sm:max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="کد سفارش، نام، شهر یا شماره"
          aria-label="جست‌وجوی سفارش"
          className="field ps-9"
        />
      </div>

      {list.length === 0 ? (
        <EmptyState title="سفارشی پیدا نشد" body="فیلتر وضعیت یا عبارت جست‌وجو را تغییر دهید." />
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const isOpen = open === o.code;
            const next = NEXT[o.status];
            const count = o.items.reduce((n, i) => n + i.qty, 0);
            return (
              <li key={o.code} className={`rounded-sm border bg-surface transition-colors ${isOpen ? "border-ink" : "border-line"}`}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : o.code)}
                  aria-expanded={isOpen}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 text-start sm:flex-nowrap sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{o.customer.name}</p>
                    <p className="text-xs text-muted">
                      <span dir="ltr">{o.code}</span> · {faDayMonth(o.createdAt)}، {faTime(o.createdAt)} · {toFa(count)} کالا
                    </p>
                  </div>
                  <span className="text-sm font-bold">{toman(o.total)}</span>
                  <StatusBadge status={o.status} />
                  <ChevronDown className={`size-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="animate-fade-in border-t border-line px-4 py-5 sm:px-5">
                    <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
                      <div>
                        <h3 className="mb-2 text-xs font-bold text-muted">اقلام سفارش</h3>
                        <ul className="divide-y divide-line rounded-sm border border-line">
                          {o.items.map((it) => (
                            <li key={`${it.productId}-${it.color}-${it.size}`} className="flex items-center gap-3 p-3 text-sm">
                              <img src={it.image} alt="" className="h-14 w-11 shrink-0 rounded-sm bg-sunk object-cover" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">{it.name}</p>
                                <p className="text-xs text-muted">
                                  {COLORS[it.color]?.name}
                                  {it.size !== ONE_SIZE && ` · سایز ${toFa(it.size)}`} · {toFa(it.qty)} × {toman(it.unitPrice)}
                                </p>
                              </div>
                              <span className="font-semibold">{toman(it.unitPrice * it.qty)}</span>
                            </li>
                          ))}
                        </ul>
                        <dl className="mt-3 space-y-1.5 text-sm">
                          <div className="flex justify-between text-muted">
                            <dt>هزینه ارسال</dt>
                            <dd>{o.shipping ? toman(o.shipping) : "رایگان"}</dd>
                          </div>
                          <div className="flex justify-between font-bold">
                            <dt>جمع کل · {PAYMENT_LABELS[o.payment]}</dt>
                            <dd>{toman(o.total)}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <h3 className="mb-2 text-xs font-bold text-muted">اطلاعات مشتری</h3>
                          <p className="flex items-center gap-2 text-sm">
                            <Phone className="size-4 text-muted" />
                            <a href={`tel:${o.customer.phone}`} dir="ltr" className="font-semibold hover:text-accent">
                              {toFa(o.customer.phone)}
                            </a>
                          </p>
                          <p className="mt-1.5 flex items-start gap-2 text-sm text-ink-soft">
                            <MapPin className="mt-1 size-4 shrink-0 text-muted" />
                            <span>
                              {o.customer.city}، {o.customer.address}
                              {o.customer.postal && <span className="block text-xs text-muted">کد پستی: {toFa(o.customer.postal)}</span>}
                            </span>
                          </p>
                          {o.note && <p className="mt-2 rounded-sm bg-bg px-3 py-2 text-sm">یادداشت مشتری: {o.note}</p>}
                        </div>

                        <div>
                          <h3 className="mb-2 text-xs font-bold text-muted">تاریخچه</h3>
                          <ol className="space-y-1 text-xs text-ink-soft">
                            {o.history.map((h, i) => (
                              <li key={i} className="flex justify-between gap-2">
                                <span>{statusLabel(h.status)}</span>
                                <span className="text-muted">
                                  {faDayMonth(h.at)}، {faTime(h.at)}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                          {next && (
                            <button type="button" onClick={() => change(o, next.to)} className={btn.small}>
                              {next.label}
                            </button>
                          )}
                          <label className="sr-only" htmlFor={`st-${o.code}`}>
                            تغییر وضعیت
                          </label>
                          <select
                            id={`st-${o.code}`}
                            value={o.status}
                            onChange={(e) => change(o, e.target.value as OrderStatus)}
                            className="rounded-sm border border-line-strong bg-surface px-2.5 py-2 text-sm"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          {o.status !== "cancelled" && o.status !== "delivered" && (
                            <button
                              type="button"
                              onClick={() => ask(o.code, () => change(o, "cancelled"))}
                              className={`rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${
                                armed === o.code ? "bg-accent text-white" : "text-accent hover:bg-accent-soft"
                              }`}
                            >
                              {armed === o.code ? "برای لغو دوباره بزنید" : "لغو سفارش"}
                            </button>
                          )}
                          <Link
                            href={`/track?code=${o.code}`}
                            target="_blank"
                            className="ms-auto inline-flex items-center gap-1.5 self-center text-xs font-semibold text-muted hover:text-ink"
                          >
                            <ExternalLink className="size-3.5" /> صفحه‌ی پیگیری مشتری
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

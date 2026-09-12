"use client";

import { useMemo, useState } from "react";
import type { Order } from "@/lib/catalog";
import { faDayMonth, toFa, toman, tomanShort } from "@/lib/fa";

const DAY = 86_400_000;

/** Tick step of 1, 2, 2.5 or 5 × 10ⁿ that gives about `ticks` gridlines. */
function niceStep(max: number, ticks = 4) {
  const raw = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

/**
 * Daily revenue, single series — one hue, no legend (the title names it),
 * recessive grid, hover/focus tooltip per bar, and a table view.
 * Time runs with the reading direction: oldest on the right, today on the left.
 */
export function SalesChart({ orders, days = 14 }: { orders: Order[]; days?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);

  const data = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: days }, (_, k) => {
      const start = today.getTime() - (days - 1 - k) * DAY;
      const inDay = orders.filter((o) => o.status !== "cancelled" && o.createdAt >= start && o.createdAt < start + DAY);
      return { start, revenue: inDay.reduce((s, o) => s + o.total, 0), count: inDay.length };
    });
  }, [orders, days]);

  const max = Math.max(...data.map((d) => d.revenue), 1);
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <section className="rounded-sm border border-line bg-surface p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">فروش روزانه — {toFa(days)} روز اخیر</h2>
          <p className="mt-0.5 text-sm text-muted">
            مجموع: <b className="text-ink">{toman(total)}</b> · بدون سفارش‌های لغوشده
          </p>
        </div>
        <button type="button" onClick={() => setAsTable((v) => !v)} className="text-xs font-semibold text-accent hover:underline">
          {asTable ? "نمایش نمودار" : "نمایش جدول"}
        </button>
      </div>

      {asTable ? (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface text-xs text-muted">
              <tr>
                <th className="py-2 text-start font-semibold">روز</th>
                <th className="py-2 text-start font-semibold">سفارش</th>
                <th className="py-2 text-end font-semibold">فروش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...data].reverse().map((d) => (
                <tr key={d.start}>
                  <td className="py-2">{faDayMonth(d.start)}</td>
                  <td className="py-2">{toFa(d.count)}</td>
                  <td className="py-2 text-end font-semibold">{toman(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-3">
          {/* y-axis labels */}
          <div className="relative h-52 w-14 shrink-0 text-[0.68rem] text-muted" aria-hidden>
            {ticks.map((t) => (
              <span key={t} className="absolute end-0 translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
                {t === 0 ? "۰" : tomanShort(t)}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative h-52" onMouseLeave={() => setHover(null)}>
              {ticks.map((t) => (
                <span
                  key={t}
                  aria-hidden
                  className={`absolute inset-x-0 border-t ${t === 0 ? "border-line-strong" : "border-dashed border-line"}`}
                  style={{ bottom: `${(t / top) * 100}%` }}
                />
              ))}
              <ul className="absolute inset-0 flex items-end gap-[2px]" aria-label="فروش روزانه">
                {data.map((d, i) => {
                  const h = (d.revenue / top) * 100;
                  const on = hover === i;
                  return (
                    <li
                      key={d.start}
                      tabIndex={0}
                      aria-label={`${faDayMonth(d.start)}: ${toman(d.revenue)}، ${toFa(d.count)} سفارش`}
                      onMouseEnter={() => setHover(i)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      className="relative flex h-full flex-1 items-end justify-center outline-none"
                    >
                      <span
                        className={`block w-[min(64%,26px)] rounded-t-[4px] transition-colors ${on ? "bg-accent-dark" : "bg-accent"}`}
                        style={{ height: d.revenue ? `max(${h}%, 3px)` : 0 }}
                      />
                      {on && (
                        <span
                          className={`pointer-events-none absolute z-10 w-max rounded-sm bg-ink px-3 py-2 text-xs leading-5 text-white shadow-lift ${
                            i < days / 2 ? "end-1/2 translate-x-1/2 sm:end-auto sm:start-1/2 sm:translate-x-0" : "end-1/2 translate-x-1/2 sm:translate-x-0"
                          }`}
                          style={{ bottom: `calc(${Math.max(h, 0)}% + 8px)` }}
                        >
                          <b className="block">{faDayMonth(d.start)}</b>
                          {toman(d.revenue)}
                          <span className="block text-[#b9b5a8]">{toFa(d.count)} سفارش</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="mt-2 flex gap-[2px] text-[0.68rem] text-muted" aria-hidden>
              {data.map((d, i) => (
                <span key={d.start} className={`flex-1 text-center ${i % 2 && i !== days - 1 ? "max-sm:invisible" : ""} ${hover === i ? "font-bold text-ink" : ""}`}>
                  {i === days - 1 ? "امروز" : new Date(d.start).toLocaleDateString("fa-IR", { day: "numeric" })}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

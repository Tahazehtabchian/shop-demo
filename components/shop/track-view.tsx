"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, PackageX, Search } from "lucide-react";
import { ORDER_STATUSES, type Order } from "@/lib/catalog";
import { faDate, faDayMonth, faTime, toFa, toman } from "@/lib/fa";
import { site } from "@/lib/site";
import { useStore } from "../store";
import { Skeleton, StatusBadge, btn } from "../ui";

const DAY = 86_400_000;
const STEPS = ORDER_STATUSES.filter((s) => s.id !== "cancelled");

export function TrackView() {
  const code = useSearchParams().get("code") ?? "";
  return <TrackInner key={code} code={code} />;
}

function TrackInner({ code }: { code: string }) {
  const router = useRouter();
  const { ready, findOrder } = useStore();
  const [input, setInput] = useState(code);
  const order = ready && code ? findOrder(code) : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    router.replace(v ? `/track?code=${encodeURIComponent(v)}` : "/track");
  };

  return (
    <div className="wrap max-w-2xl py-12 lg:py-16">
      <h1 className="text-[1.75rem] font-extrabold sm:text-3xl">پیگیری سفارش</h1>
      <p className="mt-2 text-[0.95rem] text-ink-soft">کد سفارش را وارد کنید تا وضعیت ارسال را ببینید.</p>

      <form onSubmit={submit} className="mt-6 flex gap-2" role="search">
        <label htmlFor="track-code" className="sr-only">
          کد سفارش
        </label>
        <input
          id="track-code"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="مثلاً ORD-48213"
          dir="ltr"
          autoComplete="off"
          className="field text-start"
        />
        <button type="submit" className={btn.small}>
          <Search className="size-4" /> پیگیری
        </button>
      </form>

      {code && !ready && <Skeleton className="mt-10 h-72" />}
      {code && ready && !order && (
        <div className="mt-10 rounded-sm bg-accent-soft p-5 text-sm leading-7 text-accent-dark">
          سفارشی با کد «{code}» پیدا نشد. در این نسخه‌ی نمایشی فقط سفارش‌های ثبت‌شده در همین مرورگر قابل پیگیری هستند.
        </div>
      )}
      {order && <OrderTimeline order={order} />}
    </div>
  );
}

function OrderTimeline({ order }: { order: Order }) {
  const at = (status: string) => [...order.history].reverse().find((h) => h.status === status)?.at;
  const current = STEPS.findIndex((s) => s.id === order.status);

  return (
    <div className="mt-10 animate-fade-up rounded-sm border border-line bg-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
        <div>
          <p className="text-xs text-muted">سفارش</p>
          <p className="text-lg font-extrabold" dir="ltr">
            {order.code}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <dl className="grid grid-cols-2 gap-4 border-b border-line py-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted">تاریخ ثبت</dt>
          <dd className="mt-0.5 font-semibold">{faDate(order.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">مبلغ</dt>
          <dd className="mt-0.5 font-semibold">{toman(order.total)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">تعداد کالا</dt>
          <dd className="mt-0.5 font-semibold">{toFa(order.items.reduce((n, i) => n + i.qty, 0))} عدد</dd>
        </div>
      </dl>

      {order.status === "cancelled" ? (
        <div className="mt-6 flex items-start gap-3 rounded-sm bg-sunk p-4 text-sm">
          <PackageX className="mt-0.5 size-5 shrink-0 text-muted" />
          <div>
            <p className="font-bold">این سفارش لغو شده است</p>
            {at("cancelled") && (
              <p className="mt-0.5 text-muted">
                {faDayMonth(at("cancelled")!)}، ساعت {faTime(at("cancelled")!)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <ol className="mt-7">
          {STEPS.map((step, i) => {
            const done = i < current || (i === current && order.status === "delivered");
            const now = i === current && order.status !== "delivered";
            const time = at(step.id);
            const last = i === STEPS.length - 1;
            return (
              <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                {!last && (
                  <span className={`absolute start-[17px] top-9 bottom-0 w-0.5 ${i < current ? "bg-olive" : "bg-line"}`} aria-hidden />
                )}
                <span
                  className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    done ? "bg-olive text-white" : now ? "bg-accent text-white ring-4 ring-accent-soft" : "bg-sunk text-muted"
                  }`}
                >
                  {done ? <Check className="size-4" strokeWidth={2.5} /> : toFa(i + 1)}
                </span>
                <div className="pt-1">
                  <p className={`font-bold ${done || now ? "text-ink" : "text-muted"}`}>{step.label}</p>
                  <p className="mt-0.5 text-sm text-muted">{step.hint}</p>
                  {time && (done || now) ? (
                    <p className="mt-1 text-xs text-muted">
                      {faDayMonth(time)}، ساعت {faTime(time)}
                    </p>
                  ) : (
                    step.id === "delivered" && (
                      <p className="mt-1 text-xs text-muted">تخمین: {faDate(order.createdAt + site.deliveryDays * DAY)}</p>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-7 rounded-sm bg-bg px-4 py-3 text-xs leading-6 text-muted">
        برای امتحان: در پنل مدیریت ← سفارش‌ها، وضعیت این سفارش را تغییر دهید؛ این صفحه همان لحظه به‌روز می‌شود.
      </p>
    </div>
  );
}

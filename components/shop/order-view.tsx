"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { COLORS, ONE_SIZE, PAYMENT_LABELS } from "@/lib/catalog";
import { faDate, toFa, toman } from "@/lib/fa";
import { site } from "@/lib/site";
import { useStore } from "../store";
import { EmptyState, Skeleton, btn } from "../ui";

const DAY = 86_400_000;

export function OrderView() {
  const code = useSearchParams().get("code") ?? "";
  const { ready, findOrder, toast } = useStore();

  if (!ready) {
    return (
      <div className="wrap max-w-2xl py-16">
        <Skeleton className="h-96" />
      </div>
    );
  }

  const order = code ? findOrder(code) : undefined;
  if (!order) {
    return (
      <div className="wrap max-w-2xl py-16">
        <EmptyState title="سفارشی با این کد پیدا نشد" body="در نسخه‌ی نمایشی فقط سفارش‌هایی که در همین مرورگر ثبت شده‌اند در دسترس هستند.">
          <Link href="/track" className={btn.outline}>
            پیگیری سفارش
          </Link>
        </EmptyState>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.code);
      toast("کد سفارش کپی شد", "info");
    } catch {
      toast("کپی نشد؛ کد را یادداشت کنید", "error");
    }
  };

  return (
    <div className="wrap max-w-2xl py-12 lg:py-16">
      <div className="animate-fade-up text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-olive text-white">
          <Check className="size-8" strokeWidth={2.2} />
        </span>
        <h1 className="mt-5 text-[1.75rem] font-extrabold">سفارش شما ثبت شد</h1>
        <p className="mt-2 text-ink-soft">{order.customer.name} عزیز، از خرید شما سپاسگزاریم.</p>

        <div className="mx-auto mt-7 flex max-w-sm items-center justify-between gap-3 rounded-sm border border-dashed border-line-strong bg-surface px-5 py-4">
          <div className="text-start">
            <p className="text-xs text-muted">کد پیگیری سفارش</p>
            <p className="text-xl font-extrabold tracking-wider text-accent" dir="ltr">
              {order.code}
            </p>
          </div>
          <button type="button" onClick={copy} className={btn.smallOutline} aria-label="کپی کد سفارش">
            <Copy className="size-4" /> کپی
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">این کد را برای پیگیری سفارش نگه دارید.</p>
      </div>

      <div className="mt-10 rounded-sm border border-line bg-surface">
        <dl className="grid grid-cols-1 divide-y divide-line text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-x-reverse">
          <div className="p-4">
            <dt className="text-xs text-muted">روش پرداخت</dt>
            <dd className="mt-1 font-semibold">{PAYMENT_LABELS[order.payment]}</dd>
          </div>
          <div className="p-4">
            <dt className="text-xs text-muted">تحویل تقریبی</dt>
            <dd className="mt-1 font-semibold">{faDate(order.createdAt + site.deliveryDays * DAY)}</dd>
          </div>
          <div className="p-4">
            <dt className="text-xs text-muted">مبلغ کل</dt>
            <dd className="mt-1 font-semibold">{toman(order.total)}</dd>
          </div>
        </dl>
        <ul className="divide-y divide-line border-t border-line px-4">
          {order.items.map((it) => (
            <li key={`${it.productId}-${it.color}-${it.size}`} className="flex items-center gap-3 py-3 text-sm">
              <img src={it.image} alt="" className="h-14 w-11 rounded-sm bg-sunk object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{it.name}</p>
                <p className="text-xs text-muted">
                  {COLORS[it.color]?.name}
                  {it.size !== ONE_SIZE && ` · سایز ${toFa(it.size)}`} · {toFa(it.qty)} عدد
                </p>
              </div>
              <span className="font-semibold">{toman(it.unitPrice * it.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line p-4 text-sm text-ink-soft">
          <span className="text-muted">ارسال به: </span>
          {order.customer.city}، {order.customer.address}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/track?code=${order.code}`} className={btn.primary}>
          پیگیری سفارش
        </Link>
        <Link href="/shop" className={btn.outline}>
          ادامه خرید
        </Link>
      </div>

      <p className="mt-8 rounded-sm bg-accent-soft px-4 py-3 text-center text-xs leading-6 text-accent-dark">
        نسخه‌ی نمایشی: پرداختی انجام نشده است. این سفارش همین حالا در{" "}
        <Link href="/admin/orders" className="font-bold underline underline-offset-4">
          پنل مدیریت
        </Link>{" "}
        دیده می‌شود و می‌توانید وضعیتش را از آنجا تغییر دهید.
      </p>
    </div>
  );
}

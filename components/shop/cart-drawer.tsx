"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { COLORS, ONE_SIZE } from "@/lib/catalog";
import { toFa, toman } from "@/lib/fa";
import { site } from "@/lib/site";
import { useStore } from "../store";
import { QtyControl, Swatch, btn } from "../ui";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, subtotal, cartCount, setLineQty, removeLine } = useStore();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!cartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [cartOpen, setCartOpen]);

  const remaining = Math.max(0, site.freeShippingOver - subtotal);
  const progress = Math.min(100, (subtotal / site.freeShippingOver) * 100);
  const close = () => setCartOpen(false);

  return (
    <>
      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-[55] bg-ink/45 transition-opacity duration-300 ${cartOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="سبد خرید"
        inert={!cartOpen}
        className={`fixed inset-y-0 end-0 z-[60] flex w-full max-w-[26rem] flex-col bg-surface shadow-lift transition-transform duration-300 ease-out ${
          cartOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-extrabold">
            سبد خرید {cartCount > 0 && <span className="text-sm font-semibold text-muted">({toFa(cartCount)} کالا)</span>}
          </h2>
          <button ref={closeRef} type="button" onClick={close} className={btn.icon} aria-label="بستن سبد خرید">
            <X className="size-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-sunk">
              <ShoppingBag className="size-7 text-muted" strokeWidth={1.5} />
            </span>
            <p className="font-bold">سبد خرید شما خالی است</p>
            <Link href="/shop" onClick={close} className={btn.outline}>
              مشاهده محصولات
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line bg-bg px-5 py-3">
              <p className="flex items-center gap-2 text-[0.8rem] text-ink-soft">
                <Truck className="size-4 shrink-0 text-olive" />
                {remaining > 0 ? (
                  <span>
                    <b className="text-ink">{toman(remaining)}</b> تا ارسال رایگان
                  </span>
                ) : (
                  <span className="font-semibold text-olive">ارسال این سفارش رایگان است</span>
                )}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-olive transition-[width] duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="flex-1 overflow-y-auto px-5">
              {cart.map((line, i) => {
                const over = line.qty > line.available;
                return (
                  <li key={`${line.productId}-${line.color}-${line.size}`} className="flex gap-3.5 border-b border-line py-4">
                    <Link href={`/product?id=${line.productId}`} onClick={close} className="shrink-0">
                      <img src={line.product.images[0]} alt={line.product.name} className="h-[100px] w-20 rounded-sm bg-sunk object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/product?id=${line.productId}`} onClick={close} className="line-clamp-2 text-[0.9rem] font-semibold hover:text-accent">
                          {line.product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="-me-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-accent-soft hover:text-accent"
                          aria-label={`حذف ${line.product.name} از سبد`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <Swatch color={line.color} size={11} />
                        {COLORS[line.color]?.name}
                        {line.size !== ONE_SIZE && <> · سایز {toFa(line.size)}</>}
                      </p>
                      {over && <p className="mt-1 text-xs font-semibold text-accent">فقط {toFa(line.available)} عدد موجود است</p>}
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <QtyControl small value={line.qty} max={line.available} onChange={(n) => setLineQty(i, n)} />
                        <span className="text-[0.9rem] font-bold">{toman(line.unitPrice * line.qty)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-line px-5 pt-4 pb-safe">
              <div className="mb-4 flex items-center justify-between font-bold">
                <span>جمع سبد</span>
                <span>{toman(subtotal)}</span>
              </div>
              <Link href="/checkout" onClick={close} className={`${btn.primary} w-full`}>
                ادامه و ثبت سفارش
              </Link>
              <p className="mt-2.5 text-center text-xs text-muted">بدون نیاز به ساخت حساب کاربری</p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

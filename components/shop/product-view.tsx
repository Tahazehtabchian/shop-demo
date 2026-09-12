"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, Heart, RotateCcw, Share2, ShieldCheck, Truck } from "lucide-react";
import { COLORS, type ColorKey, ONE_SIZE, type Product, categoryLabel, finalPrice, stockOf } from "@/lib/catalog";
import { toFa, toman } from "@/lib/fa";
import { site } from "@/lib/site";
import { useStore } from "../store";
import { EmptyState, Price, QtyControl, Skeleton, Swatch, btn } from "../ui";
import { ProductGrid } from "./product-card";

export function ProductSkeleton() {
  return (
    <div className="wrap grid gap-8 py-8 lg:grid-cols-2 lg:gap-14 lg:py-12">
      <Skeleton className="aspect-[4/5]" />
      <div className="space-y-4 lg:pt-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}

export function ProductView() {
  const id = useSearchParams().get("id") ?? "";
  const { ready, getProduct } = useStore();
  const product = getProduct(id);

  if (!product) {
    if (!ready) return <ProductSkeleton />;
    return (
      <div className="wrap py-16">
        <EmptyState title="این محصول پیدا نشد" body="ممکن است حذف شده باشد یا لینک اشتباه وارد شده باشد.">
          <Link href="/shop" className={btn.primary}>
            مشاهده محصولات
          </Link>
        </EmptyState>
      </div>
    );
  }
  return <ProductDetail key={product.id} product={product} />;
}

function ProductDetail({ product }: { product: Product }) {
  const { products, addToCart, setCartOpen, wishlist, toggleWish, toast } = useStore();

  const colorHasStock = (c: ColorKey) => product.sizes.some((s) => stockOf(product, c, s) > 0);
  // When there is one photo per colour, picking a colour shows its photo.
  const perColor = product.images.length > 1 && product.images.length === product.colors.length;

  const [color, setColor] = useState<ColorKey>(() => product.colors.find(colorHasStock) ?? product.colors[0]);
  const [size, setSize] = useState<string | null>(() => (product.sizes.length === 1 ? product.sizes[0] : null));
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(() => (perColor ? Math.max(0, product.colors.indexOf(color)) : 0));
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    document.title = `${product.name} | ${site.descriptor}`;
  }, [product.name]);

  const wished = wishlist.includes(product.id);
  const oneSize = product.sizes.length === 1 && product.sizes[0] === ONE_SIZE;
  const available = size ? stockOf(product, color, size) : null;
  const canAdd = available === null ? colorHasStock(color) : available > 0;

  let stock: { text: string; tone: string };
  if (!colorHasStock(color)) stock = { text: "این رنگ فعلاً ناموجود است", tone: "text-accent" };
  else if (available === null) stock = { text: "برای دیدن موجودی، سایز را انتخاب کنید", tone: "text-muted" };
  else if (available === 0) stock = { text: "این سایز در رنگ انتخابی ناموجود است", tone: "text-accent" };
  else if (available <= 3) stock = { text: `تنها ${toFa(available)} عدد در انبار باقی مانده`, tone: "text-accent" };
  else stock = { text: "موجود در انبار", tone: "text-olive" };

  const pickColor = (c: ColorKey) => {
    setColor(c);
    setQty(1);
    if (perColor) setImgIdx(product.colors.indexOf(c));
  };

  const pickSize = (s: string) => {
    setSize(s);
    setQty(1);
    setSizeError(false);
  };

  const add = () => {
    if (!size) {
      setSizeError(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (addToCart(product.id, color, size, qty)) setCartOpen(true);
  };

  // In Instagram's in-app browser navigator.share is usually missing, so fall back to copying.
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        /* dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("لینک محصول کپی شد", "info");
    } catch {
      toast("کپی نشد؛ لینک را از نوار آدرس بردارید", "error");
    }
  };

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="pb-24 lg:pb-0">
      <div className="wrap grid gap-8 py-6 lg:grid-cols-2 lg:gap-14 lg:py-12">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sunk">
            <img src={product.images[imgIdx] ?? product.images[0]} alt={product.name} className="size-full object-cover" />
            {product.discount > 0 && (
              <span className="absolute start-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
                ٪{toFa(product.discount)} تخفیف
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2.5">
              {product.images.map((src, i) => (
                <button
                  key={src.slice(0, 64) + i}
                  type="button"
                  aria-label={`تصویر ${toFa(i + 1)}`}
                  aria-pressed={i === imgIdx}
                  onClick={() => setImgIdx(i)}
                  className={`h-24 w-[76px] overflow-hidden rounded-sm border-2 transition ${
                    i === imgIdx ? "border-ink" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="lg:pt-2">
          <nav aria-label="مسیر" className="flex items-center gap-1 text-[0.8rem] text-muted">
            <Link href="/shop" className="hover:text-ink">
              فروشگاه
            </Link>
            <ChevronLeft className="size-3.5" />
            <Link href={`/shop?cat=${product.category}`} className="hover:text-ink">
              {categoryLabel(product.category)}
            </Link>
          </nav>
          <h1 className="mt-3 text-[1.7rem] leading-tight font-extrabold sm:text-[2rem]">{product.name}</h1>
          <div className="mt-3">
            <Price product={product} size="lg" />
          </div>
          {product.discount > 0 && (
            <p className="mt-1 text-sm font-semibold text-olive">{toman(product.price - finalPrice(product))} صرفه‌جویی</p>
          )}
          <p className="mt-5 max-w-lg text-[0.95rem] text-ink-soft">{product.description}</p>

          <fieldset className="mt-7">
            <legend className="mb-3 text-sm font-bold">
              رنگ: <span className="font-normal text-muted">{COLORS[color]?.name}</span>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c) => {
                const on = c === color;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => pickColor(c)}
                    className={`flex items-center gap-2 rounded-full border py-1.5 ps-1.5 pe-3.5 text-sm transition-colors ${
                      on ? "border-ink bg-surface font-semibold" : "border-line-strong hover:border-ink"
                    } ${colorHasStock(c) ? "" : "opacity-55"}`}
                  >
                    <Swatch color={c} size={22} />
                    {COLORS[c]?.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {!oneSize && (
            <fieldset id="size-picker" className="mt-6 scroll-mt-28">
              <legend className="mb-3 text-sm font-bold">
                سایز: <span className="font-normal text-muted">{size ? toFa(size) : "انتخاب کنید"}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const n = stockOf(product, color, s);
                  const on = s === size;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={n === 0}
                      aria-pressed={on}
                      aria-label={n === 0 ? `سایز ${s} — ناموجود` : `سایز ${s}`}
                      onClick={() => pickSize(s)}
                      className={`min-w-12 rounded-sm border px-3 py-2.5 text-sm font-semibold transition-colors ${
                        on
                          ? "border-ink bg-ink text-white"
                          : n === 0
                            ? "cursor-not-allowed border-line bg-sunk/60 text-muted line-through"
                            : "border-line-strong bg-surface hover:border-ink"
                      }`}
                    >
                      {toFa(s)}
                    </button>
                  );
                })}
              </div>
              {sizeError && (
                <p className="mt-2 text-sm font-semibold text-accent" role="alert">
                  لطفاً سایز را انتخاب کنید.
                </p>
              )}
            </fieldset>
          )}

          <p className={`mt-5 flex items-center gap-2 text-sm font-semibold ${stock.tone}`}>
            <span className="size-2 rounded-full bg-current" aria-hidden />
            {stock.text}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <QtyControl value={qty} max={Math.max(1, available ?? 1)} onChange={setQty} />
            <button type="button" onClick={add} disabled={!canAdd} className={`${btn.primary} h-11 min-w-[11rem] flex-1 py-0`}>
              افزودن به سبد خرید
            </button>
            <button
              type="button"
              onClick={() => toggleWish(product.id)}
              aria-pressed={wished}
              aria-label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
              className="grid size-11 place-items-center rounded-sm border border-line-strong transition-colors hover:border-ink"
            >
              <Heart className={`size-5 ${wished ? "fill-accent text-accent" : ""}`} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={share}
              aria-label="اشتراک‌گذاری لینک محصول"
              className="grid size-11 place-items-center rounded-sm border border-line-strong transition-colors hover:border-ink"
            >
              <Share2 className="size-5" strokeWidth={1.8} />
            </button>
          </div>

          <ul className="mt-7 grid gap-3 rounded-sm bg-surface p-4 text-[0.85rem] text-ink-soft sm:grid-cols-3 sm:gap-2">
            <li className="flex items-center gap-2">
              <Truck className="size-4 shrink-0 text-olive" />
              ارسال به سراسر کشور
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="size-4 shrink-0 text-olive" />
              بازگشت تا ۷ روز
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0 text-olive" />
              پرداخت آنلاین یا در محل
            </li>
          </ul>

          {product.details.length > 0 && (
            <div className="mt-7 border-t border-line pt-6">
              <h2 className="mb-3 text-sm font-bold">مشخصات</h2>
              <ul className="space-y-2 text-sm text-ink-soft">
                {product.details.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-olive" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="wrap pt-10">
          <h2 className="mb-7 text-2xl font-extrabold">محصولات مرتبط</h2>
          <ProductGrid products={related} />
        </section>
      )}

      {/* Phone: keep the buy button in reach */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-safe backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted">{product.name}</p>
            <Price product={product} />
          </div>
          <button type="button" onClick={add} disabled={!canAdd} className={btn.primary}>
            افزودن به سبد
          </button>
        </div>
      </div>
    </div>
  );
}

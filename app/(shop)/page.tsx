"use client";

import Link from "next/link";
import { ArrowLeft, PackageSearch, RotateCcw, ShoppingBag, Smartphone, Truck, Wifi } from "lucide-react";
import { ProductGrid } from "@/components/shop/product-card";
import { useStore } from "@/components/store";
import { btn } from "@/components/ui";
import { CATEGORIES } from "@/lib/catalog";
import { toFa } from "@/lib/fa";

const PERKS = [
  { icon: ShoppingBag, title: "خرید بدون ثبت‌نام", body: "فقط نام، شماره و آدرس؛ بدون ساخت حساب کاربری." },
  { icon: Smartphone, title: "سازگار با اینستاگرام", body: "از لینک بیو یا دایرکت مستقیم باز می‌شود و روان کار می‌کند." },
  { icon: Wifi, title: "بدون خاموش کردن فیلترشکن", body: "سایت روی هیچ اتصالی محدودیت ندارد؛ با فیلترشکن روشن هم خرید کنید." },
  { icon: Truck, title: "ارسال به سراسر کشور", body: "ارسال رایگان برای خریدهای بالای ۲ میلیون تومان." },
];

const STEPS = [
  { icon: ShoppingBag, title: "انتخاب کنید", body: "رنگ و سایز را انتخاب کنید و به سبد اضافه کنید." },
  { icon: ArrowLeft, title: "ثبت سفارش", body: "اطلاعات ارسال را وارد کنید؛ آنلاین یا در محل بپردازید." },
  { icon: PackageSearch, title: "پیگیری با کد", body: "با کد سفارش، وضعیت ارسال را هر لحظه ببینید." },
];

function SectionHead({ title, href, linkLabel = "مشاهده همه" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-7 flex items-baseline justify-between gap-4">
      <h2 className="text-2xl font-extrabold sm:text-[1.75rem]">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:gap-2 transition-all">
          {linkLabel}
          <ArrowLeft className="size-4" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const { products } = useStore();
  const bestsellers = products.filter((p) => p.bestseller).sort((a, b) => b.sold - a.sold).slice(0, 4);
  const newArrivals = products.filter((p) => p.isNew).sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
  const maxDiscount = Math.max(0, ...products.map((p) => p.discount));

  return (
    <>
      {/* Hero */}
      <section className="wrap grid items-center gap-10 pt-8 pb-16 lg:grid-cols-2 lg:gap-14 lg:pt-14 lg:pb-24">
        <div className="animate-fade-up max-w-xl">
          <span className="mb-4 block text-sm font-semibold text-accent">مجموعه‌ی پاییز و زمستان</span>
          <h1 className="text-[2.35rem] leading-[1.25] font-extrabold tracking-tight sm:text-5xl lg:text-[3.3rem]">
            لباس‌هایی برای روزهایی که قرار است به‌یاد بمانند
          </h1>
          <p className="mt-5 max-w-md text-[1.02rem] text-ink-soft">
            طراحی ساده، پارچه‌ی باکیفیت و برشی که به تن می‌نشیند. خرید آسان و سریع، بدون ثبت‌نام اجباری.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className={btn.primary}>
              مشاهده محصولات
            </Link>
            <Link href="/shop?sale=1" className={btn.outline}>
              تخفیف‌های فصل
            </Link>
          </div>
        </div>

        <div className="relative order-first h-[360px] animate-fade-up sm:h-[440px] lg:order-none lg:h-[520px]">
          <img
            src="/images/hero-a.webp"
            alt="مدل با کت و شلوار از مجموعه‌ی جدید"
            fetchPriority="high"
            className="absolute end-0 top-0 h-[88%] w-[68%] rounded-sm object-cover"
          />
          <img
            src="/images/hero-b.webp"
            alt="رگال لباس‌های مجموعه‌ی جدید"
            className="absolute start-0 bottom-0 h-[52%] w-[50%] rounded-sm border-[6px] border-bg object-cover shadow-lift"
          />
          <span className="absolute start-3 top-6 rounded-full bg-ink px-4 py-2 text-[0.8rem] font-semibold text-white shadow-lift">
            تازه رسید
          </span>
        </div>
      </section>

      {/* Perks */}
      <section className="border-y border-line bg-surface">
        <ul className="wrap grid grid-cols-1 gap-x-8 gap-y-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Icon className="size-5" strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-[0.95rem] font-bold">{title}</p>
                <p className="mt-0.5 text-[0.82rem] leading-6 text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <section className="wrap pt-16">
        <SectionHead title="دسته‌بندی‌ها" />
        <div className="no-scrollbar -mx-[1.125rem] flex snap-x gap-4 overflow-x-auto px-[1.125rem] sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const count = products.filter((p) => p.category === c.id).length;
            return (
              <Link
                key={c.id}
                href={`/shop?cat=${c.id}`}
                className="group relative h-72 w-[62vw] max-w-[260px] shrink-0 snap-start overflow-hidden rounded-sm sm:w-auto sm:max-w-none lg:h-80"
              >
                <img src={c.image} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-[#141612]/75 via-[#141612]/10 to-transparent" />
                <span className="absolute inset-x-5 bottom-5 text-white">
                  <span className="block text-lg font-bold">{c.label}</span>
                  <span className="text-xs text-[#e7e3d6]">{toFa(count)} محصول</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="wrap pt-16">
        <SectionHead title="پرفروش‌ترین‌ها" href="/shop?sort=popular" />
        <ProductGrid products={bestsellers} />
      </section>

      {/* Promo */}
      {maxDiscount > 0 && (
        <section className="wrap pt-16">
          <div className="flex flex-col items-start justify-between gap-6 rounded-sm bg-ink px-7 py-10 text-white sm:flex-row sm:items-center sm:px-12">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-[1.7rem]">تا ٪{toFa(maxDiscount)} تخفیف روی منتخب فصل</h2>
              <p className="mt-2 max-w-md text-sm text-[#c9c6bb]">موجودی کالاهای تخفیف‌دار محدود است؛ بازگشت کالا تا ۷ روز پس از تحویل امکان‌پذیر است.</p>
            </div>
            <Link href="/shop?sale=1" className={btn.accent}>
              مشاهده تخفیف‌ها
            </Link>
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section className="wrap pt-16">
        <SectionHead title="تازه‌های فروشگاه" href="/shop" />
        <ProductGrid products={newArrivals} />
      </section>

      {/* How it works */}
      <section className="wrap pt-20">
        <div className="rounded-sm border border-line bg-surface px-6 py-10 sm:px-10">
          <h2 className="text-center text-2xl font-extrabold">خرید در سه قدم</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full border border-line-strong text-lg font-extrabold text-accent">
                  {toFa(i + 1)}
                </span>
                <p className="mt-3 flex items-center justify-center gap-2 font-bold">
                  <Icon className="size-4 text-muted" />
                  {title}
                </p>
                <p className="mx-auto mt-1 max-w-[16rem] text-sm text-muted">{body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-ink-soft">
            <RotateCcw className="size-4 text-olive" />
            ضمانت بازگشت کالا تا ۷ روز پس از تحویل
          </p>
        </div>
      </section>
    </>
  );
}

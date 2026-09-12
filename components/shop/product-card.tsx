"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { type Product, categoryLabel, totalStock } from "@/lib/catalog";
import { toFa } from "@/lib/fa";
import { useStore } from "../store";
import { Price, Swatch } from "../ui";

export function ProductCard({ product, eager }: { product: Product; eager?: boolean }) {
  const { wishlist, toggleWish } = useStore();
  const wished = wishlist.includes(product.id);
  const soldOut = totalStock(product) === 0;
  const href = `/product?id=${encodeURIComponent(product.id)}`;

  return (
    <article className="group relative">
      <Link href={href} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sunk">
          <img
            src={product.images[0]}
            alt={product.name}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className={`size-full object-cover transition duration-500 group-hover:scale-[1.03] ${soldOut ? "opacity-70 grayscale-[35%]" : ""}`}
          />
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
          <div className="absolute start-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {product.discount > 0 && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[0.7rem] font-bold text-white">٪{toFa(product.discount)} تخفیف</span>
            )}
            {product.isNew && <span className="rounded-full bg-ink px-2.5 py-1 text-[0.7rem] font-bold text-white">جدید</span>}
          </div>
          {soldOut && (
            <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-2 text-center text-xs font-bold text-white">ناموجود</span>
          )}
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="line-clamp-1 text-[0.93rem] font-semibold text-ink group-hover:text-accent">{product.name}</h3>
          <p className="text-xs text-muted">{categoryLabel(product.category)}</p>
          <div className="pt-0.5">
            <Price product={product} />
          </div>
          {product.colors.length > 1 && (
            <div className="flex gap-1.5 pt-1" aria-label={`${toFa(product.colors.length)} رنگ`}>
              {product.colors.slice(0, 5).map((c) => (
                <Swatch key={c} color={c} size={13} />
              ))}
            </div>
          )}
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleWish(product.id)}
        aria-pressed={wished}
        aria-label={wished ? `حذف ${product.name} از علاقه‌مندی‌ها` : `افزودن ${product.name} به علاقه‌مندی‌ها`}
        className={`absolute end-2.5 top-2.5 grid size-9 place-items-center rounded-full bg-white/92 shadow-soft transition-opacity duration-150 focus-visible:opacity-100 ${
          wished ? "" : "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        }`}
      >
        <Heart className={`size-[17px] ${wished ? "fill-accent text-accent" : "text-ink"}`} strokeWidth={1.8} />
      </button>
    </article>
  );
}

export function ProductGrid({ products, eager }: { products: Product[]; eager?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} eager={eager && i < 4} />
      ))}
    </div>
  );
}

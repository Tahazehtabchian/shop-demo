"use client";

import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { toFa } from "@/lib/fa";
import { useStore } from "../store";
import { EmptyState, Skeleton, btn } from "../ui";
import { ProductGrid } from "./product-card";

export function WishlistView() {
  const { ready, wishlist, getProduct } = useStore();
  const items = wishlist.map(getProduct).filter((p): p is Product => !!p);

  return (
    <div className="wrap py-10 lg:py-14">
      <h1 className="text-[1.75rem] font-extrabold sm:text-3xl">علاقه‌مندی‌ها</h1>
      <p className="mt-1 mb-8 text-sm text-muted">{ready ? `${toFa(items.length)} محصول` : " "}</p>
      {!ready ? (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/5]" />
          ))}
        </div>
      ) : items.length ? (
        <ProductGrid products={items} />
      ) : (
        <EmptyState title="هنوز محصولی را نشان نکرده‌اید" body="با زدن قلب روی هر محصول، آن را برای بعد نگه دارید.">
          <Link href="/shop" className={btn.primary}>
            مشاهده محصولات
          </Link>
        </EmptyState>
      )}
    </div>
  );
}

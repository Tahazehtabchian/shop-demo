import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/shop/shop-view";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "محصولات" };

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="wrap grid grid-cols-2 gap-6 py-14 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/5]" />
          ))}
        </div>
      }
    >
      <ShopView />
    </Suspense>
  );
}

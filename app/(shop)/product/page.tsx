import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductView } from "@/components/shop/product-view";
import { ProductSkeleton } from "@/components/shop/product-view";

export const metadata: Metadata = { title: "محصول" };

// One static page serves every product via `?id=`.
export default function ProductPage() {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductView />
    </Suspense>
  );
}

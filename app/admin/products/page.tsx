import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsAdmin } from "@/components/admin/products-admin";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "محصولات" };

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <ProductsAdmin />
    </Suspense>
  );
}

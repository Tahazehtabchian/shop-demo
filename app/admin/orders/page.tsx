import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersAdmin } from "@/components/admin/orders-admin";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "سفارش‌ها" };

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <OrdersAdmin />
    </Suspense>
  );
}

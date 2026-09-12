import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderView } from "@/components/shop/order-view";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "سفارش ثبت شد" };

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="wrap max-w-2xl py-16"><Skeleton className="h-96" /></div>}>
      <OrderView />
    </Suspense>
  );
}

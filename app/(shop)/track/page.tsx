import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackView } from "@/components/shop/track-view";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "پیگیری سفارش" };

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="wrap max-w-2xl py-16"><Skeleton className="h-64" /></div>}>
      <TrackView />
    </Suspense>
  );
}

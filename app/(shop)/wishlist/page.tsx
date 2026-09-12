import type { Metadata } from "next";
import { WishlistView } from "@/components/shop/wishlist-view";

export const metadata: Metadata = { title: "علاقه‌مندی‌ها" };

export default function WishlistPage() {
  return <WishlistView />;
}

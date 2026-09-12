import { CartDrawer } from "@/components/shop/cart-drawer";
import { Footer } from "@/components/shop/footer";
import { Header } from "@/components/shop/header";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}

"use client";

/**
 * The whole demo's state — products, orders, cart and wishlist — lives here
 * and is persisted to localStorage, so an order placed in the shop shows up
 * in the admin panel, survives a refresh, and syncs between open tabs.
 *
 * There is no server. Swapping this provider's actions for API calls is the
 * path to the real product; the components only ever talk to `useStore()`.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  type ColorKey,
  type Order,
  type OrderStatus,
  type PaymentMethod,
  type Product,
  SEED_PRODUCTS,
  finalPrice,
  orderTotals,
  seedOrders,
  stockOf,
  variantKey,
} from "@/lib/catalog";
import { toLatin } from "@/lib/fa";

const STORAGE_KEY = "shop-demo.v1";

export type CartLine = { productId: string; color: ColorKey; size: string; qty: number };
export type ResolvedLine = CartLine & { product: Product; unitPrice: number; available: number };

export type ToastTone = "success" | "info" | "error";
export type Toast = { id: number; text: string; tone: ToastTone };

export type CheckoutInput = {
  name: string;
  phone: string;
  city: string;
  address: string;
  postal?: string;
  note?: string;
  payment: PaymentMethod;
};

type Persisted = { products: Product[]; orders: Order[]; cart: CartLine[]; wishlist: string[] };

type StoreValue = {
  /** false until localStorage has been read — render placeholders until then. */
  ready: boolean;

  products: Product[];
  orders: Order[];
  getProduct: (id: string) => Product | undefined;

  cart: ResolvedLine[];
  cartCount: number;
  subtotal: number;
  addToCart: (productId: string, color: ColorKey, size: string, qty: number) => boolean;
  setLineQty: (index: number, qty: number) => void;
  removeLine: (index: number) => void;

  wishlist: string[];
  toggleWish: (productId: string) => void;

  placeOrder: (input: CheckoutInput) => Order | null;
  findOrder: (code: string) => Order | undefined;

  saveProduct: (product: Product) => boolean;
  deleteProduct: (id: string) => void;
  setOrderStatus: (code: string, status: OrderStatus) => void;
  resetDemo: () => void;

  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;

  toasts: Toast[];
  toast: (text: string, tone?: ToastTone) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function freshState(): Persisted {
  return { products: SEED_PRODUCTS, orders: seedOrders(Date.now()), cart: [], wishlist: [] };
}

function readStorage(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Persisted;
    if (!Array.isArray(data.products) || !Array.isArray(data.orders)) return null;
    return { products: data.products, orders: data.orders, cart: data.cart ?? [], wishlist: data.wishlist ?? [] };
  } catch {
    return null;
  }
}

/** Returns false when the browser refuses the write (quota, private mode). */
function writeStorage(data: Persisted): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function adjustStock(products: Product[], items: { productId: string; color: string; size: string; qty: number }[], sign: 1 | -1) {
  return products.map((p) => {
    const mine = items.filter((it) => it.productId === p.id);
    if (!mine.length) return p;
    const stock = { ...p.stock };
    let sold = p.sold;
    for (const it of mine) {
      const key = variantKey(it.color, it.size);
      stock[key] = Math.max(0, (stock[key] ?? 0) + sign * it.qty);
      sold = Math.max(0, sold - sign * it.qty);
    }
    return { ...p, stock, sold };
  });
}

function newOrderCode(existing: Order[]) {
  for (;;) {
    const code = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    if (!existing.some((o) => o.code === code)) return code;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<Persisted>(() => ({
    products: SEED_PRODUCTS,
    orders: [],
    cart: [],
    wishlist: [],
  }));
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);
  // Skip writing back the state we just read, and writes that came from another tab.
  const skipWrite = useRef(true);

  const toast = useCallback((text: string, tone: ToastTone = "success") => {
    const id = ++toastSeq.current;
    setToasts((all) => [...all.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), 3200);
  }, []);

  // Hydrate from storage once, after mount.
  useEffect(() => {
    const stored = readStorage();
    const next = stored ?? freshState();
    skipWrite.current = !!stored;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setState(next);
    setReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const synced = readStorage();
      if (synced) {
        skipWrite.current = true;
        setState(synced);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    writeStorage(state);
  }, [state, ready]);

  const getProduct = useCallback((id: string) => state.products.find((p) => p.id === id), [state.products]);

  const cart = useMemo<ResolvedLine[]>(() => {
    const out: ResolvedLine[] = [];
    for (const line of state.cart) {
      const product = state.products.find((p) => p.id === line.productId);
      if (!product) continue;
      out.push({ ...line, product, unitPrice: finalPrice(product), available: stockOf(product, line.color, line.size) });
    }
    return out;
  }, [state.cart, state.products]);

  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const subtotal = cart.reduce((n, l) => n + l.unitPrice * l.qty, 0);

  const addToCart = useCallback<StoreValue["addToCart"]>(
    (productId, color, size, qty) => {
      const product = state.products.find((p) => p.id === productId);
      if (!product) return false;
      const available = stockOf(product, color, size);
      const idx = state.cart.findIndex((l) => l.productId === productId && l.color === color && l.size === size);
      const inCart = idx >= 0 ? state.cart[idx].qty : 0;
      const nextQty = Math.min(available, inCart + qty);
      if (nextQty <= inCart) {
        toast(available ? "به سقف موجودی این کالا رسیدید" : "این ترکیب رنگ و سایز موجود نیست", "error");
        return false;
      }
      setState((s) => {
        const list = [...s.cart];
        if (idx >= 0) list[idx] = { ...list[idx], qty: nextQty };
        else list.push({ productId, color, size, qty: nextQty });
        return { ...s, cart: list };
      });
      return true;
    },
    [state.products, state.cart, toast],
  );

  const setLineQty = useCallback((index: number, qty: number) => {
    setState((s) => {
      const line = s.cart[index];
      if (!line) return s;
      const product = s.products.find((p) => p.id === line.productId);
      const max = product ? stockOf(product, line.color, line.size) : 0;
      const list = [...s.cart];
      list[index] = { ...line, qty: Math.max(1, Math.min(max || 1, qty)) };
      return { ...s, cart: list };
    });
  }, []);

  const removeLine = useCallback((index: number) => {
    setState((s) => ({ ...s, cart: s.cart.filter((_, i) => i !== index) }));
  }, []);

  const toggleWish = useCallback(
    (productId: string) => {
      const had = state.wishlist.includes(productId);
      setState((s) => ({
        ...s,
        wishlist: had ? s.wishlist.filter((id) => id !== productId) : [...s.wishlist, productId],
      }));
      toast(had ? "از علاقه‌مندی‌ها حذف شد" : "به علاقه‌مندی‌ها اضافه شد", "info");
    },
    [state.wishlist, toast],
  );

  const placeOrder = useCallback<StoreValue["placeOrder"]>(
    (input) => {
      if (!cart.length) return null;
      const short = cart.find((l) => l.qty > l.available);
      if (short) {
        toast(`موجودی «${short.product.name}» کافی نیست`, "error");
        return null;
      }
      const now = Date.now();
      const items = cart.map((l) => ({
        productId: l.productId,
        name: l.product.name,
        image: l.product.images[0] ?? "",
        color: l.color,
        size: l.size,
        qty: l.qty,
        unitPrice: l.unitPrice,
      }));
      const { shipping, total } = orderTotals(subtotal);
      const order: Order = {
        code: newOrderCode(state.orders),
        createdAt: now,
        customer: { name: input.name, phone: input.phone, city: input.city, address: input.address, postal: input.postal },
        note: input.note,
        payment: input.payment,
        items,
        subtotal,
        shipping,
        total,
        status: "pending",
        history: [{ status: "pending", at: now }],
      };
      setState((s) => ({
        ...s,
        products: adjustStock(s.products, items, -1),
        orders: [order, ...s.orders],
        cart: [],
      }));
      return order;
    },
    [cart, subtotal, state.orders, toast],
  );

  const findOrder = useCallback(
    (code: string) => {
      // Accepts «ORD-48213», «ord48213», «48213» or «۴۸۲۱۳».
      const needle = toLatin(code).trim().toUpperCase().replace(/\s/g, "").replace(/^(ORD-?)?/, "ORD-");
      return state.orders.find((o) => o.code === needle);
    },
    [state.orders],
  );

  const saveProduct = useCallback(
    (product: Product) => {
      const next = {
        ...state,
        products: state.products.some((p) => p.id === product.id)
          ? state.products.map((p) => (p.id === product.id ? product : p))
          : [product, ...state.products],
      };
      // Uploaded photos are data URLs; check they fit before committing.
      if (!writeStorage(next)) {
        toast("حافظه‌ی مرورگر پر است؛ تصویر کوچک‌تری انتخاب کنید", "error");
        return false;
      }
      skipWrite.current = true;
      setState(next);
      return true;
    },
    [state, toast],
  );

  const deleteProduct = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      products: s.products.filter((p) => p.id !== id),
      cart: s.cart.filter((l) => l.productId !== id),
      wishlist: s.wishlist.filter((w) => w !== id),
    }));
  }, []);

  const setOrderStatus = useCallback((code: string, status: OrderStatus) => {
    setState((s) => {
      const order = s.orders.find((o) => o.code === code);
      if (!order || order.status === status) return s;
      let products = s.products;
      // Cancelling returns the items to stock; reviving a cancelled order takes them again.
      if (status === "cancelled") products = adjustStock(products, order.items, 1);
      else if (order.status === "cancelled") products = adjustStock(products, order.items, -1);
      const updated: Order = { ...order, status, history: [...order.history, { status, at: Date.now() }] };
      return { ...s, products, orders: s.orders.map((o) => (o.code === code ? updated : o)) };
    });
  }, []);

  const resetDemo = useCallback(() => {
    setState(freshState());
    toast("داده‌های نمایشی به حالت اول برگشت", "info");
  }, [toast]);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      products: state.products,
      orders: state.orders,
      getProduct,
      cart,
      cartCount,
      subtotal,
      addToCart,
      setLineQty,
      removeLine,
      wishlist: state.wishlist,
      toggleWish,
      placeOrder,
      findOrder,
      saveProduct,
      deleteProduct,
      setOrderStatus,
      resetDemo,
      cartOpen,
      setCartOpen,
      toasts,
      toast,
    }),
    [
      ready, state.products, state.orders, state.wishlist, getProduct, cart, cartCount, subtotal, addToCart,
      setLineQty, removeLine, toggleWish, placeOrder, findOrder, saveProduct, deleteProduct, setOrderStatus,
      resetDemo, cartOpen, toasts, toast,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

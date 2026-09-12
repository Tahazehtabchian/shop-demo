"use client";

import { CircleAlert, CircleCheck, Info, Minus, Plus } from "lucide-react";
import { COLORS, type ColorKey, type OrderStatus, type Product, finalPrice, statusLabel } from "@/lib/catalog";
import { toFa, toman } from "@/lib/fa";
import { useStore } from "./store";

/* ─── Buttons ─────────────────────────────────────────────────────────── */

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45";

export const btn = {
  primary: `${base} bg-ink px-6 py-3 text-[0.95rem] text-white hover:bg-accent-dark`,
  accent: `${base} bg-accent px-6 py-3 text-[0.95rem] text-white hover:bg-accent-dark`,
  outline: `${base} border border-line-strong bg-transparent px-6 py-3 text-[0.95rem] text-ink hover:border-ink`,
  small: `${base} bg-ink px-4 py-2 text-sm text-white hover:bg-accent-dark`,
  smallOutline: `${base} border border-line-strong bg-surface px-4 py-2 text-sm text-ink hover:border-ink`,
  icon: "relative inline-flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-accent-soft",
  link: "font-semibold text-accent underline-offset-4 hover:underline",
};

/* ─── Product bits ────────────────────────────────────────────────────── */

export function Price({ product, size = "md" }: { product: Pick<Product, "price" | "discount">; size?: "md" | "lg" }) {
  const now = finalPrice(product);
  const big = size === "lg";
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
      {product.discount > 0 && (
        <span className={`text-muted line-through decoration-1 ${big ? "text-base" : "text-[0.8rem]"}`}>
          <span className="sr-only">قیمت قبل: </span>
          {toman(product.price)}
        </span>
      )}
      <span className={`font-bold ${product.discount ? "text-accent" : "text-ink"} ${big ? "text-[1.35rem]" : "text-[0.95rem]"}`}>
        {toman(now)}
      </span>
    </span>
  );
}

export function Swatch({ color, size = 14 }: { color: ColorKey; size?: number }) {
  const c = COLORS[color];
  return (
    <span
      className="inline-block shrink-0 rounded-full ring-1 ring-black/15 ring-inset"
      style={{ width: size, height: size, background: c?.hex }}
      title={c?.name}
    />
  );
}

export function QtyControl({
  value,
  onChange,
  max,
  small,
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
  small?: boolean;
}) {
  const h = small ? "h-9" : "h-11";
  return (
    <div className={`inline-flex items-center rounded-sm border border-line-strong bg-surface ${h}`}>
      <button
        type="button"
        aria-label="افزایش تعداد"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="grid h-full w-9 place-items-center text-ink disabled:opacity-30"
      >
        <Plus className="size-4" />
      </button>
      <span className="min-w-8 text-center text-[0.95rem] font-semibold tabular-nums" aria-live="polite">
        {toFa(value)}
      </span>
      <button
        type="button"
        aria-label="کاهش تعداد"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className="grid h-full w-9 place-items-center text-ink disabled:opacity-30"
      >
        <Minus className="size-4" />
      </button>
    </div>
  );
}

/* ─── Order status ────────────────────────────────────────────────────── */

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-soft text-amber",
  confirmed: "bg-sky-soft text-sky",
  shipped: "bg-accent-soft text-accent-dark",
  delivered: "bg-olive-soft text-olive",
  cancelled: "bg-sunk text-muted line-through decoration-1",
};

const STATUS_DOT: Record<OrderStatus, string> = {
  pending: "bg-amber",
  confirmed: "bg-sky",
  shipped: "bg-accent",
  delivered: "bg-olive",
  cancelled: "bg-muted",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[status]}`}>
      <span className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden />
      {statusLabel(status)}
    </span>
  );
}

/* ─── Toasts ──────────────────────────────────────────────────────────── */

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-4 pb-safe sm:items-start sm:ps-6"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const Icon = t.tone === "error" ? CircleAlert : t.tone === "info" ? Info : CircleCheck;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex animate-toast items-center gap-2.5 rounded-sm bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lift"
          >
            <Icon className={`size-4 shrink-0 ${t.tone === "error" ? "text-[#f0a9a2]" : "text-[#cfd8c4]"}`} />
            {t.text}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Misc ────────────────────────────────────────────────────────────── */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-sm bg-sunk ${className}`} />;
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-line-strong px-6 py-16 text-center">
      <p className="text-lg font-bold">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

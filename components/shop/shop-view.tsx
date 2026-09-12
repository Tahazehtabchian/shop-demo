"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES, COLORS, type ColorKey, ONE_SIZE, SIZE_SETS, categoryLabel, finalPrice, totalStock } from "@/lib/catalog";
import { normalizeFa, toFa } from "@/lib/fa";
import { useStore } from "../store";
import { EmptyState, btn } from "../ui";
import { ProductGrid } from "./product-card";

const SORTS = [
  { id: "newest", label: "جدیدترین" },
  { id: "popular", label: "پرفروش‌ترین" },
  { id: "price-asc", label: "ارزان‌ترین" },
  { id: "price-desc", label: "گران‌ترین" },
] as const;

// Every size in display order, so the filter lists them the way a shopper expects.
// Deduplicated: waist 38 and shoe 38 are the same label.
const SIZE_ORDER: string[] = Array.from(new Set<string>([...SIZE_SETS.apparel, ...SIZE_SETS.waist, ...SIZE_SETS.shoes]));

export function ShopView() {
  const params = useSearchParams();
  const cat = params.get("cat") ?? "all";
  const q = params.get("q") ?? "";
  const sale = params.get("sale") === "1";
  const sort = params.get("sort") ?? "newest";
  // Re-mount on navigation so colour/size picks from another category don't linger.
  return <ShopInner key={`${cat}|${q}|${sale}`} cat={cat} q={q} sale={sale} sort={sort} query={params.toString()} />;
}

function ShopInner({ cat, q, sale, sort, query }: { cat: string; q: string; sale: boolean; sort: string; query: string }) {
  const router = useRouter();
  const { products } = useStore();
  const [colors, setColors] = useState<ColorKey[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [inStock, setInStock] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(query);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  };

  const inCategory = useMemo(() => products.filter((p) => cat === "all" || p.category === cat), [products, cat]);

  const colorOptions = useMemo(() => {
    const set = new Set(inCategory.flatMap((p) => p.colors));
    return (Object.keys(COLORS) as ColorKey[]).filter((c) => set.has(c));
  }, [inCategory]);

  const sizeOptions = useMemo(() => {
    const set = new Set(inCategory.flatMap((p) => p.sizes));
    return SIZE_ORDER.filter((s) => set.has(s));
  }, [inCategory]);

  const list = useMemo(() => {
    const needle = normalizeFa(q);
    const out = inCategory.filter((p) => {
      if (sale && !p.discount) return false;
      if (needle && !normalizeFa(`${p.name} ${p.description} ${categoryLabel(p.category)}`).includes(needle)) return false;
      if (colors.length && !p.colors.some((c) => colors.includes(c))) return false;
      if (sizes.length && !p.sizes.some((s) => sizes.includes(s))) return false;
      if (inStock && totalStock(p) === 0) return false;
      return true;
    });
    const by = {
      newest: (a: (typeof out)[0], b: (typeof out)[0]) => b.createdAt - a.createdAt,
      popular: (a: (typeof out)[0], b: (typeof out)[0]) => b.sold - a.sold,
      "price-asc": (a: (typeof out)[0], b: (typeof out)[0]) => finalPrice(a) - finalPrice(b),
      "price-desc": (a: (typeof out)[0], b: (typeof out)[0]) => finalPrice(b) - finalPrice(a),
    }[sort] ?? ((a: (typeof out)[0], b: (typeof out)[0]) => b.createdAt - a.createdAt);
    // Sold-out items sink to the bottom whatever the sort.
    return out.sort((a, b) => Number(totalStock(a) === 0) - Number(totalStock(b) === 0) || by(a, b));
  }, [inCategory, q, sale, colors, sizes, inStock, sort]);

  const title = q ? `نتایج جست‌وجو برای «${q}»` : sale ? "کالاهای تخفیف‌دار" : cat === "all" ? "همه محصولات" : categoryLabel(cat);
  const activeCount = colors.length + sizes.length + Number(inStock) + Number(sale);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const clearAll = () => {
    setColors([]);
    setSizes([]);
    setInStock(false);
    if (sale) setParams({ sale: null });
  };

  const categoryButtons = [{ id: "all", label: "همه" }, ...CATEGORIES.map((c) => ({ id: c.id as string, label: c.label }))];

  return (
    <div className="wrap py-10 lg:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-extrabold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">{toFa(list.length)} محصول</p>
        </div>
        {q && (
          <button type="button" onClick={() => setParams({ q: null })} className={btn.smallOutline}>
            <X className="size-4" />
            پاک کردن جست‌وجو
          </button>
        )}
      </div>

      {/* Category pills — the quick switch on phones */}
      <div className="no-scrollbar -mx-[1.125rem] mb-5 flex gap-2 overflow-x-auto px-[1.125rem] lg:hidden">
        {categoryButtons.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setParams({ cat: c.id === "all" ? null : c.id })}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              cat === c.id ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-soft"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Toolbar sits above both columns so the phone filter panel opens right under its button. */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls="shop-filters"
          className={`${btn.smallOutline} lg:hidden`}
        >
          <SlidersHorizontal className="size-4" />
          فیلترها
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-accent text-[0.7rem] text-white">{toFa(activeCount)}</span>
          )}
        </button>
        <label className="ms-auto flex items-center gap-2 text-sm text-muted">
          <span className="hidden sm:inline">مرتب‌سازی:</span>
          <select
            value={sort}
            onChange={(e) => setParams({ sort: e.target.value === "newest" ? null : e.target.value })}
            className="rounded-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink"
            aria-label="مرتب‌سازی"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[230px_1fr] lg:gap-10">
        <aside id="shop-filters" className={`${filtersOpen ? "block" : "hidden"} rounded-sm border border-line bg-surface p-5 lg:sticky lg:top-24 lg:block lg:border-0 lg:bg-transparent lg:p-0`}>
          <div className="hidden border-b border-line pb-5 lg:block">
            <p className="mb-3 text-sm font-bold">دسته‌بندی</p>
            <ul className="space-y-1">
              {categoryButtons.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-ink-soft hover:text-ink">
                    <input
                      type="radio"
                      name="cat"
                      checked={cat === c.id}
                      onChange={() => setParams({ cat: c.id === "all" ? null : c.id })}
                      className="size-4 accent-accent"
                    />
                    {c.id === "all" ? "همه محصولات" : c.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {colorOptions.length > 1 && (
            <fieldset className="border-b border-line py-5">
              <legend className="mb-3 text-sm font-bold">رنگ</legend>
              <div className="flex flex-wrap gap-2.5">
                {colorOptions.map((c) => {
                  const on = colors.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={on}
                      title={COLORS[c].name}
                      aria-label={COLORS[c].name}
                      onClick={() => setColors((v) => toggle(v, c))}
                      className={`size-8 rounded-full border-2 transition ${on ? "border-ink scale-110" : "border-transparent"}`}
                    >
                      <span className="block size-full rounded-full ring-1 ring-black/15 ring-inset" style={{ background: COLORS[c].hex }} />
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {sizeOptions.some((s) => s !== ONE_SIZE) && (
            <fieldset className="border-b border-line py-5">
              <legend className="mb-3 text-sm font-bold">سایز</legend>
              <div className="flex flex-wrap gap-2">
                {sizeOptions
                  .filter((s) => s !== ONE_SIZE)
                  .map((s) => {
                    const on = sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setSizes((v) => toggle(v, s))}
                        className={`min-w-11 rounded-sm border px-2.5 py-1.5 text-[0.82rem] font-semibold transition-colors ${
                          on ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-soft hover:border-ink"
                        }`}
                      >
                        {toFa(s)}
                      </button>
                    );
                  })}
              </div>
            </fieldset>
          )}

          <div className="space-y-2 pt-5">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="size-4 accent-accent" />
              فقط کالاهای موجود
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
              <input type="checkbox" checked={sale} onChange={(e) => setParams({ sale: e.target.checked ? "1" : null })} className="size-4 accent-accent" />
              فقط تخفیف‌دارها
            </label>
            {activeCount > 0 && (
              <button type="button" onClick={clearAll} className="pt-2 text-sm font-semibold text-accent hover:underline">
                پاک کردن فیلترها
              </button>
            )}
          </div>
        </aside>

        <div>
          {list.length ? (
            <ProductGrid products={list} eager />
          ) : (
            <EmptyState title="محصولی با این فیلترها پیدا نشد" body="فیلترها را کمتر کنید یا عبارت دیگری جست‌وجو کنید.">
              <button type="button" onClick={() => router.replace("/shop")} className={btn.outline}>
                نمایش همه محصولات
              </button>
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}

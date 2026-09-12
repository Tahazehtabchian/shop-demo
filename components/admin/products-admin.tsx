"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { CATEGORIES, type Product, categoryLabel, finalPrice, totalStock } from "@/lib/catalog";
import { normalizeFa, toFa, toman } from "@/lib/fa";
import { useStore } from "../store";
import { EmptyState, Skeleton, btn } from "../ui";
import { ProductEditor } from "./product-editor";
import { PageHead, useConfirm } from "./shell";

function StockPill({ n }: { n: number }) {
  const cls = n === 0 ? "bg-sunk text-muted" : n <= 5 ? "bg-amber-soft text-amber" : "bg-olive-soft text-olive";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${cls}`}>
      {n === 0 ? "ناموجود" : `${toFa(n)} عدد`}
    </span>
  );
}

export function ProductsAdmin() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, products, deleteProduct, toast } = useStore();
  const { armed, ask } = useConfirm();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  // The editor is addressed by URL (?edit=id / ?new=1) so dashboard links can open it.
  const editId = params.get("edit");
  const creating = params.get("new") === "1";
  const editing = editId ? products.find((p) => p.id === editId) : undefined;
  const closeEditor = () => router.replace("/admin/products", { scroll: false });

  const list = useMemo(() => {
    const needle = normalizeFa(q);
    return products.filter((p) => (cat === "all" || p.category === cat) && (!needle || normalizeFa(p.name).includes(needle)));
  }, [products, q, cat]);

  if (!ready) return <Skeleton className="h-96" />;

  const remove = (p: Product) =>
    ask(p.id, () => {
      deleteProduct(p.id);
      toast(`«${p.name}» حذف شد`, "info");
    });

  return (
    <>
      <PageHead title="محصولات" sub={`${toFa(products.length)} محصول در فروشگاه`}>
        <button type="button" onClick={() => router.replace("/admin/products?new=1", { scroll: false })} className={btn.small}>
          <Plus className="size-4" /> افزودن محصول
        </button>
      </PageHead>

      <div className="mb-5 flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجوی نام محصول"
            aria-label="جست‌وجوی محصول"
            className="field ps-9"
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="field w-auto" aria-label="دسته‌بندی">
          <option value="all">همه دسته‌ها</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState title="محصولی پیدا نشد" body="عبارت جست‌وجو یا دسته‌بندی را تغییر دهید." />
      ) : (
        <div className="overflow-hidden rounded-sm border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="hidden border-b border-line bg-bg text-xs text-muted md:table-header-group">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">محصول</th>
                <th className="px-4 py-3 text-start font-semibold">دسته</th>
                <th className="px-4 py-3 text-start font-semibold">قیمت</th>
                <th className="px-4 py-3 text-start font-semibold">موجودی</th>
                <th className="px-4 py-3 text-start font-semibold">فروش</th>
                <th className="px-4 py-3">
                  <span className="sr-only">عملیات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((p) => (
                <tr key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4 md:table-row md:p-0">
                  <td className="flex min-w-0 flex-1 basis-full items-center gap-3 md:table-cell md:px-4 md:py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="h-14 w-11 shrink-0 rounded-sm bg-sunk object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{p.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.discount > 0 && (
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.68rem] font-bold text-accent">٪{toFa(p.discount)}</span>
                          )}
                          {p.isNew && <span className="rounded-full bg-sunk px-2 py-0.5 text-[0.68rem] font-bold">جدید</span>}
                          {p.bestseller && <span className="rounded-full bg-sunk px-2 py-0.5 text-[0.68rem] font-bold">پرفروش</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted md:table-cell md:px-4 md:py-3">{categoryLabel(p.category)}</td>
                  <td className="font-semibold md:table-cell md:px-4 md:py-3">{toman(finalPrice(p))}</td>
                  <td className="md:table-cell md:px-4 md:py-3">
                    <StockPill n={totalStock(p)} />
                  </td>
                  <td className="hidden text-muted md:table-cell md:px-4 md:py-3">{toFa(p.sold)}</td>
                  <td className="ms-auto md:table-cell md:px-4 md:py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/product?id=${p.id}`}
                        target="_blank"
                        aria-label={`مشاهده ${p.name} در فروشگاه`}
                        className="grid size-9 place-items-center rounded-sm text-muted hover:bg-bg hover:text-ink"
                      >
                        <Eye className="size-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => router.replace(`/admin/products?edit=${p.id}`, { scroll: false })}
                        aria-label={`ویرایش ${p.name}`}
                        className="grid size-9 place-items-center rounded-sm text-muted hover:bg-bg hover:text-ink"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(p)}
                        aria-label={`حذف ${p.name}`}
                        className={`flex h-9 items-center justify-center gap-1 rounded-sm px-2 text-xs font-bold transition-colors ${
                          armed === p.id ? "bg-accent text-white" : "text-muted hover:bg-accent-soft hover:text-accent"
                        }`}
                      >
                        <Trash2 className="size-4" />
                        {armed === p.id && "حذف؟"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && <ProductEditor key={editing?.id ?? "new"} product={editing} onClose={closeEditor} />}
    </>
  );
}

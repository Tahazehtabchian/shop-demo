"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Upload, X } from "lucide-react";
import {
  CATEGORIES,
  COLORS,
  COLOR_KEYS,
  type CategoryId,
  type ColorKey,
  IMAGE_LIBRARY,
  type Product,
  SIZE_SETS,
  SIZE_SET_LABELS,
  type SizeSetId,
  finalPrice,
  sizeSetFor,
  variantKey,
} from "@/lib/catalog";
import { toFa, toLatin, toman } from "@/lib/fa";
import { useStore } from "../store";
import { Swatch, btn } from "../ui";

type Errors = Partial<Record<"name" | "price" | "discount" | "colors" | "sizes" | "images", string>>;

const digits = (v: string) => toLatin(v).replace(/\D/g, "");

/** Id and timestamp for a product created in the panel (called from the save handler only). */
function stampNew() {
  const at = Date.now();
  return { id: `p-${at.toString(36)}`, createdAt: at };
}

/** Resize an uploaded photo to a 4:5 JPEG data URL (~800×1000) so it fits in localStorage. */
function toProductPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const W = 800;
      const H = 1000;
      const scale = Math.max(W / img.width, H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

export function ProductEditor({ product, onClose }: { product?: Product; onClose: () => void }) {
  const { saveProduct, toast } = useStore();
  const isNew = !product;
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState<CategoryId>(product?.category ?? "men");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [discount, setDiscount] = useState(product?.discount ? String(product.discount) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [details, setDetails] = useState(product?.details.join("\n") ?? "");
  const [isNewFlag, setIsNewFlag] = useState(product?.isNew ?? true);
  const [bestseller, setBestseller] = useState(product?.bestseller ?? false);
  const [colors, setColors] = useState<ColorKey[]>(product?.colors ?? ["black"]);
  const [sizeSet, setSizeSet] = useState<SizeSetId>(product ? sizeSetFor(product.sizes) : "apparel");
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? ["M", "L", "XL"]);
  const [stock, setStock] = useState<Record<string, number>>(product?.stock ?? {});
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const pickCategory = (c: CategoryId) => {
    setCategory(c);
    // A new product follows its category's usual size chart.
    if (isNew) {
      const set = CATEGORIES.find((x) => x.id === c)!.sizeSet;
      setSizeSet(set);
      setSizes([...SIZE_SETS[set]].slice(0, set === "shoes" ? 6 : 5));
    }
  };

  const pickSizeSet = (s: SizeSetId) => {
    setSizeSet(s);
    setSizes([...SIZE_SETS[s]]);
  };

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const orderedSizes = (SIZE_SETS[sizeSet] as readonly string[]).filter((s) => sizes.includes(s));

  const setQty = (c: string, s: string, v: string) => setStock((st) => ({ ...st, [variantKey(c, s)]: Number(digits(v)) || 0 }));
  const fillAll = (n: number) =>
    setStock((st) => {
      const next = { ...st };
      for (const c of colors) for (const s of orderedSizes) next[variantKey(c, s)] = n;
      return next;
    });

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(toProductPhoto));
      setImages((im) => [...im, ...urls]);
      setErrors((er) => ({ ...er, images: undefined }));
    } catch {
      toast("این فایل تصویر قابل خواندن نیست", "error");
    } finally {
      setUploading(false);
    }
  };

  const priceNum = Number(digits(price));
  const discountNum = Number(digits(discount)) || 0;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Errors = {};
    if (name.trim().length < 2) er.name = "نام محصول را وارد کنید";
    if (!priceNum || priceNum < 1000) er.price = "قیمت را به تومان وارد کنید";
    if (discountNum > 90) er.discount = "تخفیف حداکثر ۹۰٪";
    if (!colors.length) er.colors = "حداقل یک رنگ انتخاب کنید";
    if (!orderedSizes.length) er.sizes = "حداقل یک سایز انتخاب کنید";
    if (!images.length) er.images = "حداقل یک تصویر اضافه کنید";
    setErrors(er);
    if (Object.keys(er).length) {
      dialogRef.current?.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const cleanStock: Record<string, number> = {};
    for (const c of colors) for (const s of orderedSizes) cleanStock[variantKey(c, s)] = stock[variantKey(c, s)] ?? 0;

    const stamp = product ? { id: product.id, createdAt: product.createdAt } : stampNew();
    const next: Product = {
      id: stamp.id,
      name: name.trim(),
      category,
      price: priceNum,
      discount: discountNum,
      colors,
      sizes: orderedSizes,
      stock: cleanStock,
      images,
      description: description.trim(),
      details: details
        .split("\n")
        .map((d) => d.trim())
        .filter(Boolean),
      isNew: isNewFlag,
      bestseller,
      sold: product?.sold ?? 0,
      createdAt: stamp.createdAt,
    };
    if (saveProduct(next)) {
      toast(isNew ? "محصول جدید منتشر شد" : "تغییرات ذخیره شد");
      onClose();
    }
  };

  const err = (k: keyof Errors) =>
    errors[k] && (
      <p data-error className="mt-1.5 text-xs font-semibold text-accent">
        {errors[k]}
      </p>
    );

  return (
    <div className="fixed inset-0 z-[60] flex animate-fade-in items-stretch justify-center bg-ink/50 sm:items-center sm:p-6">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        className="flex max-h-dvh w-full max-w-3xl flex-col bg-surface shadow-lift outline-none sm:max-h-[92dvh] sm:rounded-sm"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="editor-title" className="text-lg font-extrabold">
            {isNew ? "افزودن محصول جدید" : "ویرایش محصول"}
          </h2>
          <button type="button" onClick={onClose} className={btn.icon} aria-label="بستن">
            <X className="size-5" />
          </button>
        </div>

        <form id="product-form" onSubmit={save} noValidate className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
          {/* Basics */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="pe-name" className="label">
                نام محصول
              </label>
              <input id="pe-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} className="field" placeholder="مثلاً پیراهن کتان" />
              {err("name")}
            </div>
            <div>
              <label htmlFor="pe-price" className="label">
                قیمت (تومان)
              </label>
              <input
                id="pe-price"
                inputMode="numeric"
                dir="ltr"
                value={price}
                onChange={(e) => setPrice(digits(e.target.value))}
                aria-invalid={!!errors.price}
                className="field text-start"
                placeholder="1250000"
              />
              {priceNum > 0 && <p className="mt-1 text-xs text-muted">{toman(priceNum)}</p>}
              {err("price")}
            </div>
            <div>
              <label htmlFor="pe-discount" className="label">
                تخفیف (درصد، اختیاری)
              </label>
              <input
                id="pe-discount"
                inputMode="numeric"
                dir="ltr"
                value={discount}
                onChange={(e) => setDiscount(digits(e.target.value).slice(0, 2))}
                aria-invalid={!!errors.discount}
                className="field text-start"
                placeholder="0"
              />
              {discountNum > 0 && priceNum > 0 && (
                <p className="mt-1 text-xs text-muted">قیمت نهایی: {toman(finalPrice({ price: priceNum, discount: discountNum }))}</p>
              )}
              {err("discount")}
            </div>
            <div>
              <label htmlFor="pe-cat" className="label">
                دسته‌بندی
              </label>
              <select id="pe-cat" value={category} onChange={(e) => pickCategory(e.target.value as CategoryId)} className="field">
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-5 pb-2.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={isNewFlag} onChange={(e) => setIsNewFlag(e.target.checked)} className="size-4 accent-accent" />
                برچسب «جدید»
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={bestseller} onChange={(e) => setBestseller(e.target.checked)} className="size-4 accent-accent" />
                در «پرفروش‌ها»
              </label>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pe-desc" className="label">
                توضیحات
              </label>
              <textarea id="pe-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="field resize-y" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pe-details" className="label">
                مشخصات <span className="font-normal text-muted">(هر خط یک مورد)</span>
              </label>
              <textarea
                id="pe-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="field resize-y"
                placeholder={"جنس: پنبه\nبرش: راسته"}
              />
            </div>
          </div>

          {/* Images */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold">
                تصاویر <span className="font-normal text-muted">(اولی تصویر اصلی است)</span>
              </h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className={btn.smallOutline} disabled={uploading}>
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} آپلود
                </button>
                <button type="button" onClick={() => setLibraryOpen((v) => !v)} aria-expanded={libraryOpen} className={btn.smallOutline}>
                  <ImagePlus className="size-4" /> از گالری
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onUpload} />
              </div>
            </div>
            {images.length > 0 ? (
              <ul className="flex flex-wrap gap-3">
                {images.map((src, i) => (
                  <li key={src.slice(-48) + i} className="relative">
                    <img src={src} alt="" className={`h-28 w-[88px] rounded-sm object-cover ${i === 0 ? "ring-2 ring-ink ring-offset-2" : ""}`} />
                    <button
                      type="button"
                      onClick={() => setImages((im) => im.filter((_, k) => k !== i))}
                      aria-label="حذف تصویر"
                      className="absolute -end-2 -top-2 grid size-6 place-items-center rounded-full bg-ink text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => setImages((im) => [im[i], ...im.filter((_, k) => k !== i)])}
                        aria-label="تصویر اصلی شود"
                        title="تصویر اصلی شود"
                        className="absolute start-1 bottom-1 grid size-6 place-items-center rounded-full bg-white/90 text-ink"
                      >
                        <Star className="size-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-sm border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted">
                هنوز تصویری اضافه نشده؛ از گوشی آپلود کنید یا از گالری انتخاب کنید.
              </p>
            )}
            {err("images")}
            {libraryOpen && (
              <div className="mt-4 grid grid-cols-5 gap-2 rounded-sm bg-bg p-3 sm:grid-cols-8">
                {IMAGE_LIBRARY.map((src) => {
                  const on = images.includes(src);
                  return (
                    <button
                      key={src}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setImages((im) => toggle(im, src));
                        setErrors((er) => ({ ...er, images: undefined }));
                      }}
                      className={`overflow-hidden rounded-sm border-2 ${on ? "border-accent" : "border-transparent opacity-80 hover:opacity-100"}`}
                    >
                      <img src={src} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Variants */}
          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold">رنگ‌ها</h3>
              <div className="flex flex-wrap gap-2">
                {COLOR_KEYS.map((c) => {
                  const on = colors.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setColors((v) => toggle(v, c))}
                      className={`flex items-center gap-1.5 rounded-full border py-1 ps-1 pe-3 text-xs transition-colors ${
                        on ? "border-ink bg-bg font-bold" : "border-line-strong text-ink-soft"
                      }`}
                    >
                      <Swatch color={c} size={18} />
                      {COLORS[c].name}
                    </button>
                  );
                })}
              </div>
              {err("colors")}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold">جدول سایز</h3>
              <select value={sizeSet} onChange={(e) => pickSizeSet(e.target.value as SizeSetId)} className="field mb-3" aria-label="جدول سایز">
                {(Object.keys(SIZE_SETS) as SizeSetId[]).map((s) => (
                  <option key={s} value={s}>
                    {SIZE_SET_LABELS[s]}
                  </option>
                ))}
              </select>
              {sizeSet !== "one" && (
                <div className="flex flex-wrap gap-1.5">
                  {SIZE_SETS[sizeSet].map((s) => {
                    const on = sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setSizes((v) => toggle(v, s))}
                        className={`min-w-10 rounded-sm border px-2 py-1.5 text-xs font-bold ${on ? "border-ink bg-ink text-white" : "border-line-strong text-ink-soft"}`}
                      >
                        {toFa(s)}
                      </button>
                    );
                  })}
                </div>
              )}
              {err("sizes")}
            </div>
          </section>

          {/* Stock matrix */}
          {colors.length > 0 && orderedSizes.length > 0 && (
            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold">موجودی انبار به تفکیک رنگ و سایز</h3>
                <div className="flex gap-1.5 text-xs">
                  <span className="self-center text-muted">پر کردن همه با:</span>
                  {[0, 5, 10].map((n) => (
                    <button key={n} type="button" onClick={() => fillAll(n)} className="rounded-sm border border-line-strong px-2.5 py-1 font-bold hover:border-ink">
                      {toFa(n)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto rounded-sm border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-bg text-xs text-muted">
                    <tr>
                      <th className="px-3 py-2 text-start font-semibold">رنگ</th>
                      {orderedSizes.map((s) => (
                        <th key={s} className="px-2 py-2 font-semibold">
                          {toFa(s)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {colors.map((c) => (
                      <tr key={c}>
                        <th scope="row" className="px-3 py-2 text-start font-semibold whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <Swatch color={c} size={14} />
                            {COLORS[c].name}
                          </span>
                        </th>
                        {orderedSizes.map((s) => (
                          <td key={s} className="px-1.5 py-1.5">
                            <input
                              inputMode="numeric"
                              dir="ltr"
                              aria-label={`موجودی ${COLORS[c].name} سایز ${s}`}
                              value={String(stock[variantKey(c, s)] ?? 0)}
                              onChange={(e) => setQty(c, s, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full min-w-12 rounded-sm border border-line-strong bg-surface px-2 py-1.5 text-center font-semibold focus:border-ink focus:outline-none"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 pt-3.5 pb-safe sm:pb-3.5">
          <button type="button" onClick={onClose} className={btn.smallOutline}>
            انصراف
          </button>
          <button type="submit" form="product-form" className={btn.small}>
            {isNew ? "ثبت و انتشار محصول" : "ذخیره تغییرات"}
          </button>
        </div>
      </div>
    </div>
  );
}

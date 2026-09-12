"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, CreditCard, Loader2, Lock } from "lucide-react";
import { COLORS, ONE_SIZE, type PaymentMethod, orderTotals } from "@/lib/catalog";
import { isMobile, toFa, toLatin, toman } from "@/lib/fa";
import { useStore } from "../store";
import { EmptyState, Skeleton, btn } from "../ui";

type FormKey = "name" | "phone" | "city" | "address" | "postal" | "note";
type Errors = Partial<Record<FormKey, string>>;

const PAYMENTS: { id: PaymentMethod; title: string; body: string; icon: typeof CreditCard }[] = [
  { id: "online", title: "پرداخت آنلاین", body: "با همه‌ی کارت‌های عضو شتاب (در این نسخه نمایشی است)", icon: CreditCard },
  { id: "cod", title: "پرداخت در محل", body: "پرداخت با کارتخوان هنگام تحویل", icon: Banknote },
];

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutView() {
  const router = useRouter();
  const { ready, cart, subtotal, placeOrder } = useStore();
  const [form, setForm] = useState<Record<FormKey, string>>({ name: "", phone: "", city: "", address: "", postal: "", note: "" });
  const [payment, setPayment] = useState<PaymentMethod>("online");
  const [errors, setErrors] = useState<Errors>({});
  const [stage, setStage] = useState<"form" | "paying" | "done">("form");
  const { shipping, total } = orderTotals(subtotal);

  if (!ready) {
    return (
      <div className="wrap grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-96" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  // Placing the order empties the cart; don't flash the empty state while navigating away.
  if (stage === "done") {
    return (
      <div className="wrap flex items-center justify-center gap-2 py-32 text-muted">
        <Loader2 className="size-5 animate-spin" /> در حال نمایش رسید سفارش…
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="wrap py-16">
        <EmptyState title="سبد خرید شما خالی است" body="برای ثبت سفارش، ابتدا محصولی به سبد اضافه کنید.">
          <Link href="/shop" className={btn.primary}>
            مشاهده محصولات
          </Link>
        </EmptyState>
      </div>
    );
  }

  const set = (key: FormKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const e: Errors = {};
    if (form.name.trim().length < 3) e.name = "نام و نام خانوادگی را کامل وارد کنید";
    if (!isMobile(form.phone)) e.phone = "شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود";
    if (!form.city.trim()) e.city = "شهر را وارد کنید";
    if (form.address.trim().length < 10) e.address = "آدرس را کامل‌تر بنویسید (خیابان، کوچه، پلاک، واحد)";
    if (form.postal.trim() && !/^\d{10}$/.test(toLatin(form.postal).replace(/[\s-]/g, ""))) e.postal = "کد پستی باید ۱۰ رقم باشد";
    setErrors(e);
    return e;
  };

  const finish = () => {
    const order = placeOrder({
      name: form.name.trim(),
      phone: toLatin(form.phone).replace(/\D/g, ""),
      city: form.city.trim(),
      address: form.address.trim(),
      postal: form.postal.trim() ? toLatin(form.postal).replace(/\D/g, "") : undefined,
      note: form.note.trim() || undefined,
      payment,
    });
    if (order) {
      setStage("done");
      router.push(`/order?code=${order.code}`);
    } else {
      setStage("form");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    const first = (Object.keys(found) as FormKey[])[0];
    if (first) {
      document.getElementById(`cf-${first}`)?.focus();
      return;
    }
    if (payment === "online") {
      setStage("paying");
      window.setTimeout(finish, 1800);
    } else {
      finish();
    }
  };

  const input = (key: FormKey, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      id={`cf-${key}`}
      value={form[key]}
      onChange={set(key)}
      aria-invalid={!!errors[key]}
      aria-describedby={errors[key] ? `cf-${key}-error` : undefined}
      className="field"
      {...extra}
    />
  );

  return (
    <div className="wrap py-10 lg:py-14">
      <h1 className="mb-8 text-[1.75rem] font-extrabold sm:text-3xl">تکمیل سفارش</h1>

      <form onSubmit={submit} noValidate className="grid items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <section className="rounded-sm border border-line bg-surface p-5 sm:p-7">
            <h2 className="mb-5 text-base font-bold">اطلاعات ارسال</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="cf-name" label="نام و نام خانوادگی" error={errors.name}>
                {input("name", { autoComplete: "name", placeholder: "مثلاً سارا محمدی" })}
              </Field>
              <Field id="cf-phone" label="شماره موبایل" error={errors.phone}>
                {input("phone", { autoComplete: "tel", inputMode: "tel", dir: "ltr", placeholder: "09123456789", className: "field text-start" })}
              </Field>
              <Field id="cf-city" label="شهر" error={errors.city}>
                {input("city", { autoComplete: "address-level2", placeholder: "مثلاً تهران" })}
              </Field>
              <Field id="cf-postal" label="کد پستی (اختیاری)" error={errors.postal}>
                {input("postal", { autoComplete: "postal-code", inputMode: "numeric", dir: "ltr", className: "field text-start" })}
              </Field>
              <div className="sm:col-span-2">
                <Field id="cf-address" label="آدرس کامل" error={errors.address}>
                  <textarea
                    id="cf-address"
                    rows={3}
                    value={form.address}
                    onChange={set("address")}
                    autoComplete="street-address"
                    aria-invalid={!!errors.address}
                    aria-describedby={errors.address ? "cf-address-error" : undefined}
                    placeholder="خیابان، کوچه، پلاک، واحد"
                    className="field resize-y"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="cf-note" label="توضیحات سفارش (اختیاری)">
                  <textarea id="cf-note" rows={2} value={form.note} onChange={set("note")} className="field resize-y" placeholder="مثلاً زمان مناسب تحویل" />
                </Field>
              </div>
            </div>
          </section>

          <fieldset className="rounded-sm border border-line bg-surface p-5 sm:p-7">
            <legend className="sr-only">روش پرداخت</legend>
            <h2 className="mb-5 text-base font-bold" aria-hidden>
              روش پرداخت
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENTS.map(({ id, title, body, icon: Icon }) => {
                const on = payment === id;
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-start gap-3 rounded-sm border p-4 transition-colors ${
                      on ? "border-ink bg-accent-soft/60" : "border-line-strong hover:border-ink"
                    }`}
                  >
                    <input type="radio" name="payment" value={id} checked={on} onChange={() => setPayment(id)} className="mt-1 size-4 accent-accent" />
                    <span>
                      <span className="flex items-center gap-2 font-semibold">
                        <Icon className="size-4 text-muted" /> {title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">{body}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <aside className="rounded-sm border border-line bg-surface p-5 sm:p-7 lg:sticky lg:top-24">
          <h2 className="mb-4 text-base font-bold">خلاصه سفارش</h2>
          <ul className="divide-y divide-line">
            {cart.map((l) => (
              <li key={`${l.productId}-${l.color}-${l.size}`} className="flex gap-3 py-3">
                <img src={l.product.images[0]} alt="" className="h-16 w-13 shrink-0 rounded-sm bg-sunk object-cover" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-semibold">{l.product.name}</p>
                  <p className="text-xs text-muted">
                    {COLORS[l.color]?.name}
                    {l.size !== ONE_SIZE && ` · سایز ${toFa(l.size)}`} · {toFa(l.qty)} عدد
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{toman(l.unitPrice * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <dt>جمع کالاها</dt>
              <dd>{toman(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-soft">
              <dt>هزینه ارسال</dt>
              <dd className={shipping ? "" : "font-semibold text-olive"}>{shipping ? toman(shipping) : "رایگان"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold">
              <dt>مبلغ قابل پرداخت</dt>
              <dd>{toman(total)}</dd>
            </div>
          </dl>
          <button type="submit" className={`${btn.primary} mt-6 w-full`}>
            <Lock className="size-4" />
            {payment === "online" ? "پرداخت و ثبت سفارش" : "ثبت سفارش"}
          </button>
          <p className="mt-3 text-xs leading-6 text-muted">
            این یک نسخه‌ی نمایشی است؛ هیچ پرداخت واقعی انجام نمی‌شود و اطلاعات فقط در همین مرورگر ذخیره می‌شود.
          </p>
        </aside>
      </form>

      {stage === "paying" && (
        <div className="fixed inset-0 z-[80] grid animate-fade-in place-items-center bg-ink/60 px-6" role="alertdialog" aria-label="در حال پرداخت">
          <div className="w-full max-w-sm rounded-sm bg-surface p-8 text-center shadow-lift">
            <Loader2 className="mx-auto size-9 animate-spin text-accent" />
            <p className="mt-4 font-bold">در حال اتصال به درگاه پرداخت…</p>
            <p className="mt-1 text-sm text-muted">مبلغ {toman(total)}</p>
            <p className="mt-4 text-xs text-muted">در نسخه‌ی نمایشی، پرداخت شبیه‌سازی می‌شود.</p>
          </div>
        </div>
      )}
    </div>
  );
}

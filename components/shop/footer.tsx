import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { site } from "@/lib/site";

// Brand glyphs are drawn inline: lucide no longer ships brand icons.
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden>
      <path d="M21 4 3 11l6 2.2M21 4l-3.5 16-8.5-6.8M21 4 9 13.2v5.3l3-3" />
    </svg>
  );
}

const year = new Date().toLocaleDateString("fa-IR", { year: "numeric" });

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <p className="text-2xl font-black">
            {site.name}
            <span className="text-accent">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-ink-soft">
            {site.descriptor} — خرید بدون ثبت‌نام اجباری، ارسال به سراسر کشور و پیگیری سفارش با کد.
          </p>
          <div className="mt-5 flex gap-2.5">
            <a href={site.social.instagram} aria-label="اینستاگرام" className="grid size-10 place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink">
              <InstagramIcon />
            </a>
            <a href={site.social.telegram} aria-label="تلگرام" className="grid size-10 place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink">
              <TelegramIcon />
            </a>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold">دسته‌بندی‌ها</h2>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link href={`/shop?cat=${c.id}`} className="hover:text-accent">
                  {c.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop?sale=1" className="hover:text-accent">
                تخفیف‌ها
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold">راهنمای خرید</h2>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li>
              <Link href="/track" className="hover:text-accent">
                پیگیری سفارش
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-accent">
                علاقه‌مندی‌ها
              </Link>
            </li>
            <li>ارسال رایگان برای خریدهای بالای ۲ میلیون تومان</li>
            <li>ضمانت بازگشت کالا تا ۷ روز</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold">ارتباط با ما</h2>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li>
              <a href={site.phoneHref} className="hover:text-accent" dir="ltr">
                {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-accent">
                {site.email}
              </a>
            </li>
            <li>{site.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-muted">
          <span>© {year} — نسخه‌ی نمایشی؛ محصولات، قیمت‌ها و سفارش‌ها نمونه هستند.</span>
        </div>
      </div>
    </footer>
  );
}

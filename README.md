# Online shop — demo

**Live demo:** https://lustrous-lily-f800b4.netlify.app  
**Admin panel:** https://lustrous-lily-f800b4.netlify.app/admin (no password in the demo)

A Persian (RTL) clothing-shop demo with a working admin panel. It is a sample
for pitching to clients, **not** a production shop: there is no server, and all
data lives in the visitor's browser (`localStorage`).

The shop has **no name yet**. The logo and titles show the descriptor «فروشگاه».
Change it in one place: [`lib/site.ts`](lib/site.ts).

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static site in out/
npm start            # serve out/ locally
```

## What works

**Shop**: home, product list with category/colour/size/stock/discount filters and
sorting, search (accepts Persian and Arabic letter variants), product page with
colour-matched photos and per-variant stock, wishlist, cart drawer with a
free-shipping progress bar, guest checkout (validation accepts Persian digits),
a simulated online payment step, order receipt, and order tracking by code.

**Admin panel** (`/admin`, no password in the demo):
- dashboard with 7-day sales, a 14-day revenue chart, pending orders and low-stock alerts
- products: add, edit and delete, with discount, «new»/«bestseller» flags, colours,
  size charts and a stock table per colour × size
- product photos: pick from the bundled gallery, or upload from the phone
  (resized in the browser to 800×1000 JPEG)
- orders: filter by status, search, advance or cancel. Cancelling returns the
  items to stock.

**Wiring between the two**:
- An order placed in the shop lowers stock and appears in the panel immediately.
- A status change in the panel shows on the customer's tracking page.
- Open tabs stay in sync.
- «بازنشانی داده‌های نمایشی» in the panel restores the sample data.

## "Instagram-friendly, no need to switch off the VPN"

The site makes these claims, and the build keeps them true:

- **No third-party requests at runtime.** `next/font` bundles Vazirmatn at build
  time, and every photo is a local WebP in `public/images`. No Google Fonts,
  Unsplash, CDN or analytics calls happen at runtime, so nothing breaks when a
  foreign service is filtered, and nothing blocks visitors who arrive through a VPN.
- **In-app browser details.**
  - Inputs are 16px on phones, so iOS doesn't zoom on focus.
  - `alert`/`confirm` are never used: destructive actions ask for a second tap.
  - Hover-only controls stay visible on touch screens.
  - The layout respects safe areas.
  - Sharing falls back to copy-link, because `navigator.share` is often missing in
    Instagram's in-app browser.
  - Open Graph tags plus `og.jpg` give a preview when the link is sent in a DM.

This was checked in desktop Chrome and in mobile emulation with Instagram's
iOS user-agent, **not** inside the real Instagram app. Test one real link from a
phone before promising it to a client.

## Deploy

The site is a fully static export, so any static host works:

- **Vercel**: import the repo; the defaults are fine. Set `NEXT_PUBLIC_SITE_URL` to the
  final URL so link previews use absolute image URLs.
- **Netlify / any host**: run `npm run build` and publish `out/`.

The `build` script also runs [`scripts/flatten-segments.mjs`](scripts/flatten-segments.mjs).
Next 16's static export writes link-prefetch files into nested folders but
requests them by flat names. The script copies them so prefetching doesn't 404
on a plain static host.

Whether a given host is reachable from Iran **without** a VPN depends on that host
(`*.vercel.app` has been filtered at times). For a client demo, open the final
link from an Iranian connection first, or put it behind your own domain.

## Where things live

| Path | What |
|---|---|
| `lib/site.ts` | Name, contact placeholders, shipping fee and free-shipping threshold |
| `lib/catalog.ts` | Types, colours, size charts, the 21 seed products, the sample orders |
| `components/store.tsx` | All state and actions (cart, orders, products), persisted to `localStorage` |
| `components/shop/*` | Storefront |
| `components/admin/*` | Admin panel |
| `public/images/SOURCES.md` | Photo credits (Unsplash License) |

To make this a real shop, replace the actions in `components/store.tsx` with API
calls (products, orders, auth, a payment gateway, SMS). The components only talk
to `useStore()`, so they don't need to change.

---

<div dir="rtl">

# فروشگاه اینترنتی — نسخه‌ی نمایشی

یک فروشگاه پوشاک فارسی و راست‌چین همراه با پنل مدیریت کارآمد. این یک **نمونه‌کار** برای ارائه به مشتری است، نه فروشگاه واقعی: هیچ سروری در کار نیست و همه‌ی داده‌ها در مرورگر خود بازدیدکننده (`localStorage`) ذخیره می‌شوند.

**لینک سایت:** https://lustrous-lily-f800b4.netlify.app
**پنل مدیریت:** https://lustrous-lily-f800b4.netlify.app/admin (در نسخه‌ی نمایشی رمز ندارد)

فروشگاه **هنوز اسم ندارد**. لوگو و عنوان‌ها همان واژه‌ی «فروشگاه» را نشان می‌دهند. برای گذاشتن اسم واقعی فقط یک جا را عوض کنید: [`lib/site.ts`](lib/site.ts).

## اجرا

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # خروجی استاتیک در پوشه‌ی out/
npm start            # اجرای خروجی روی همین کامپیوتر
```

## چه چیزهایی کار می‌کند

**فروشگاه:** صفحه‌ی اصلی، لیست محصولات با فیلتر دسته‌بندی و رنگ و سایز و موجودی و تخفیف، مرتب‌سازی، جست‌وجو (حروف فارسی و عربی را یکسان می‌گیرد، مثلاً «ي» و «ی»)، صفحه‌ی محصول با عکسِ متناسب با رنگ انتخابی و موجودی جداگانه‌ی هر ترکیب رنگ و سایز، لیست علاقه‌مندی‌ها، سبد خرید کشویی با نوار پیشرفت ارسال رایگان، تکمیل خرید بدون ثبت‌نام (اعتبارسنجی، ارقام فارسی را هم قبول می‌کند)، مرحله‌ی شبیه‌سازی‌شده‌ی پرداخت آنلاین، رسید سفارش، و پیگیری سفارش با کد.

**پنل مدیریت** (آدرس `/admin`، در این نسخه بدون رمز):
- داشبورد با فروش ۷ روز اخیر، نمودار درآمد ۱۴ روز، سفارش‌های در انتظار و هشدار کالاهای رو به اتمام
- محصولات: افزودن، ویرایش و حذف، همراه با تخفیف، برچسب «جدید» و «پرفروش»، رنگ‌ها، جدول سایز و جدول موجودی به تفکیک رنگ × سایز
- عکس محصول: انتخاب از گالری آماده یا آپلود از گوشی (در خود مرورگر به ۸۰۰×۱۰۰۰ کوچک می‌شود)
- سفارش‌ها: فیلتر بر اساس وضعیت، جست‌وجو، تغییر وضعیت یا لغو. با لغو سفارش، کالاها به موجودی برمی‌گردند.

**ارتباط این دو با هم:**
- سفارشی که در فروشگاه ثبت شود، از موجودی کم می‌کند و بی‌درنگ در پنل دیده می‌شود.
- تغییر وضعیت در پنل، در صفحه‌ی پیگیری مشتری نمایش داده می‌شود.
- تب‌های باز با هم هماهنگ می‌مانند.
- دکمه‌ی «بازنشانی داده‌های نمایشی» در پنل، داده‌های نمونه را برمی‌گرداند.

## «سازگار با اینستاگرام و بدون نیاز به خاموش کردن فیلترشکن»

سایت این ادعا را مطرح می‌کند و ساختِ پروژه آن را درست نگه می‌دارد:

- **هیچ درخواستی به سرور دیگری فرستاده نمی‌شود.** فونت وزیرمتن موقع build داخل خود سایت قرار می‌گیرد و همه‌ی عکس‌ها فایل WebP محلی در `public/images` هستند. هیچ تماسی با Google Fonts، آنسپلش، CDN یا ابزار آماری برقرار نمی‌شود؛ پس فیلتر بودن یک سرویس خارجی چیزی را خراب نمی‌کند و بازدیدکننده‌ای که با فیلترشکن آمده هم مشکلی ندارد.
- **جزئیات مرورگر داخل اینستاگرام:**
  - اندازه‌ی فیلدهای ورودی در موبایل ۱۶ پیکسل است تا iOS موقع تایپ صفحه را زوم نکند.
  - از `alert` و `confirm` استفاده نشده؛ کارهای حذفی با لمس دوم تأیید می‌شوند.
  - دکمه‌هایی که فقط با hover دیده می‌شوند، روی صفحه‌های لمسی همیشه پیدا هستند.
  - فاصله‌های امن صفحه (notch و نوار پایین) رعایت شده است.
  - دکمه‌ی اشتراک‌گذاری اگر `navigator.share` نبود — که در مرورگر اینستاگرام معمولاً نیست — به کپی کردن لینک تغییر می‌کند.
  - تگ‌های Open Graph و فایل `og.jpg` باعث می‌شوند لینک در دایرکت با عکس پیش‌نمایش فرستاده شود.

این موارد در کروم دسکتاپ و در حالت شبیه‌سازی موبایل با شناسه‌ی مرورگر اینستاگرام iOS بررسی شده‌اند، **نه** داخل خود اپلیکیشن اینستاگرام. قبل از قول دادن به مشتری، یک بار لینک را از گوشی واقعی باز کنید.

## انتشار

خروجی پروژه کاملاً استاتیک است، پس روی هر میزبان استاتیکی بالا می‌آید:

- **Netlify یا هر میزبان دیگر:** `npm run build` بزنید و پوشه‌ی `out/` را منتشر کنید.
- **Vercel:** مخزن را import کنید؛ تنظیمات پیش‌فرض کافی است. مقدار `NEXT_PUBLIC_SITE_URL` را روی آدرس نهایی بگذارید تا عکس پیش‌نمایش لینک درست کار کند.

اسکریپت `build` فایل [`scripts/flatten-segments.mjs`](scripts/flatten-segments.mjs) را هم اجرا می‌کند. Next 16 فایل‌های prefetch را در پوشه‌های تودرتو می‌سازد ولی با نام تخت صدا می‌زند؛ این اسکریپت کپی‌شان می‌کند تا روی میزبان استاتیک خطای ۴۰۴ ندهند.

اینکه یک میزبان از داخل ایران **بدون** فیلترشکن باز می‌شود یا نه، به خود آن میزبان بستگی دارد (`*.vercel.app` بعضی وقت‌ها فیلتر بوده است). برای ارائه به مشتری، اول لینک نهایی را با اینترنت ایران باز کنید یا روی دامنه‌ی خودتان بگذارید.

## هر چیزی کجاست

| مسیر | چه چیزی |
|---|---|
| `lib/site.ts` | اسم، اطلاعات تماس نمونه، هزینه‌ی ارسال و سقف ارسال رایگان |
| `lib/catalog.ts` | نوع‌ها، رنگ‌ها، جدول سایزها، ۲۱ محصول اولیه و سفارش‌های نمونه |
| `components/store.tsx` | تمام وضعیت و عملیات (سبد خرید، سفارش‌ها، محصولات) و ذخیره در `localStorage` |
| `components/shop/*` | بخش فروشگاه |
| `components/admin/*` | پنل مدیریت |
| `public/images/SOURCES.md` | منبع عکس‌ها (مجوز Unsplash) |

برای تبدیل این نمونه به فروشگاه واقعی، کافی است عملیات داخل `components/store.tsx` با درخواست به API جایگزین شود (محصولات، سفارش‌ها، ورود کاربر، درگاه پرداخت، پیامک). بقیه‌ی اجزا فقط با `useStore()` حرف می‌زنند، پس نیازی به تغییرشان نیست.

</div>

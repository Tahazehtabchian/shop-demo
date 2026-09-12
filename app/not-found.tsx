import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-7xl font-black text-accent">۴۰۴</p>
        <h1 className="mt-4 text-xl font-bold">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
        <p className="mt-2 text-sm text-muted">ممکن است آدرس اشتباه باشد یا صفحه جابه‌جا شده باشد.</p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center justify-center rounded-sm bg-ink px-6 py-3 font-semibold text-white hover:bg-accent-dark"
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    </main>
  );
}

import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { StoreProvider } from "@/components/store";
import { Toasts } from "@/components/ui";
import { site } from "@/lib/site";
import "./globals.css";

// next/font downloads the font at build time and serves it from this site —
// the page makes no request to Google, which matters for visitors in Iran.
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

// Link previews (Instagram/Telegram DMs) need an absolute image URL, so the
// build has to know its own address: from .env.production, or from whatever
// the host injects — `URL` on Netlify, the project domain on Vercel.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.descriptor} | نسخه نمایشی`, template: `%s | ${site.descriptor}` },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "fa_IR",
    title: site.descriptor,
    description: site.description,
    images: [{ url: "/images/og.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f7f5ef",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="min-h-dvh overflow-x-clip">
        <StoreProvider>
          {children}
          <Toasts />
        </StoreProvider>
      </body>
    </html>
  );
}

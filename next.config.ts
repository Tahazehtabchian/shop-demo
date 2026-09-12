import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static export: `npm run build` writes plain HTML/JS to `out/`,
  // which Vercel, Netlify or any static host can serve as-is.
  output: "export",
  poweredByHeader: false,
  images: { unoptimized: true },
  devIndicators: false,
};

export default nextConfig;

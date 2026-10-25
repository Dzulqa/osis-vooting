/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server (.next/standalone): the VPS needs no npm install or build.
  output: "standalone",
  poweredByHeader: false,
  compress: false, // nginx does the gzip
  productionBrowserSourceMaps: false,
  // Plain <img> is used everywhere; skipping the optimizer drops sharp/libvips (~16MB + CPU).
  images: { unoptimized: true },
  outputFileTracingExcludes: {
    "/**": ["./node_modules/sharp/**", "./node_modules/@img/**"],
  },
};

export default nextConfig;

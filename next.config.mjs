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
    // public/ is copied whole by scripts/package-release.sh; letting the tracer copy parts of it
    // (it guesses at runtime paths like UPLOAD_DIR/candidates) creates a partial public/ in standalone.
    "/**": ["./node_modules/sharp/**", "./node_modules/@img/**", "./public/**"],
  },
};

export default nextConfig;

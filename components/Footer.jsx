"use client";

import { usePathname } from "next/navigation";

// Shown on every page, at the bottom.
//  - Landing page: a solid strip below the content.
//  - Booth screens fill the viewport (h-dvh), so the footer floats over the bottom edge.
//  - Everything else: transparent and pulled up over the bottom of the page's own background,
//    so it blends in and adds no extra height (the page backgrounds live inside each <main>).
export default function Footer() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isBooth = pathname.startsWith("/booth");

  const layout = isLanding
    ? "bg-[#f6f9ff] py-3 backdrop-blur-sm"
    : isBooth
      ? "pointer-events-none fixed inset-x-0 bottom-0 h-10 bg-transparent"
      : "pointer-events-none relative -mt-10 flex h-10 items-center justify-center bg-transparent";

  return (
    <footer className={`z-10 w-full shrink-0 text-center text-xs text-slate-500 ${layout}`}>
      <span className="pointer-events-auto">
        © 2026 E-Voting OSIS · Developed by{" "}
        <span className="font-semibold text-violet-600">Ahmad Hilbram Dzulqa</span>
      </span>
    </footer>
  );
}

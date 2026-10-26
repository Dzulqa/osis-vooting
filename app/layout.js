import { Geist, Geist_Mono, Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import SyncProvider from "@/components/SyncProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata = {
  title: "E-Voting OSIS SMK Al Amanah",
  description: "Pemilihan Ketua & Wakil Ketua OSIS SMK Al Amanah",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <SyncProvider />
        {children}
      </body>
    </html>
  );
}

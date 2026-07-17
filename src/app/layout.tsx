import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "همبافت — زندگی هم‌مسیر",
    template: "%s · همبافت",
  },
  description:
    "همبافت؛ ردیاب اهداف، عادت‌ها و تسک‌ها با گیمیفیکیشن و پارتنر هم‌مسیر — بافته‌شده برای زندگی فارسی.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "همبافت",
  },
  icons: {
    icon: "/brand/hambaft-mark.png",
    apple: "/brand/hambaft-mark.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F9F6EE",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="texture-paper antialiased">{children}</body>
    </html>
  );
}

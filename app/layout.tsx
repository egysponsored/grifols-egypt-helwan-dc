import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GRIFOLS EGYPT HELWAN DC",
  description: "Plasma Donation Center Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

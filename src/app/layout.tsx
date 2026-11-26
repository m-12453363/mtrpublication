import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MTR PUBLICATION AND PRODUCTION — Portal Rasmi",
  description: "Sistem Pengurusan Penerbitan, Produksi & Komunikasi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body>{children}</body>
    </html>
  );
}

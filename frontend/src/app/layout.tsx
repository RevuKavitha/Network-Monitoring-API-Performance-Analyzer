import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NetPulse Dashboard",
  description: "Network Monitoring & API Performance Analyzer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

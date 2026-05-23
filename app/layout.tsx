import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DearTTS",
  description: "Personalized text to speech studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body data-desktop-app="deartts">{children}</body>
    </html>
  );
}

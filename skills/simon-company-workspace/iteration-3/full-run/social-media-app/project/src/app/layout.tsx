import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Picstory - 순간을 공유하세요",
  description: "사진을 공유하고, 소통하는 소셜 미디어 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} font-sans antialiased bg-neutral-50 text-neutral-900`}>
        <SessionProvider>
          <Navbar />
          <main className="md:ml-[72px] lg:ml-[220px] pb-16 md:pb-0 min-h-screen">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}

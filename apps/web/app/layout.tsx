import type { Metadata } from "next";
import { Fraunces, Manrope, DM_Mono } from "next/font/google";
import "animate.css/animate.min.css";
import "./globals.css";
import MotionProvider from "@/components/marketing/MotionProvider";

const fraunces = Fraunces({ subsets: ["latin", "latin-ext", "vietnamese"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "latin-ext", "vietnamese"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "QTS — Hạ tầng số cho tăng trưởng doanh nghiệp",
  description:
    "QTS phát triển nền tảng phần mềm, ứng dụng doanh nghiệp và hệ sinh thái số thông minh có khả năng mở rộng.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${fraunces.variable} ${manrope.variable} ${dmMono.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

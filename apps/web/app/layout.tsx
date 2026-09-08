import type { Metadata } from "next";
import "animate.css/animate.min.css";
import "./globals.css";
import MotionProvider from "@/components/marketing/MotionProvider";

export const metadata: Metadata = {
  title: "QTS — Hạ tầng số cho tăng trưởng doanh nghiệp",
  description:
    "QTS phát triển nền tảng phần mềm, ứng dụng doanh nghiệp và hệ sinh thái số thông minh có khả năng mở rộng.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

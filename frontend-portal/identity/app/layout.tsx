import type { Metadata } from "next";
import "animate.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trung tâm Định danh QTS",
  description: "Một tài khoản QTS cho mọi không gian làm việc doanh nghiệp.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" suppressHydrationWarning><body>{children}</body></html>;
}

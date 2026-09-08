import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trung tâm Định danh QTS",
  description: "Một tài khoản QTS cho mọi không gian làm việc doanh nghiệp.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}

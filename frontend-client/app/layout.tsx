import type { Metadata } from "next";
import "./globals.css";
import MotionProvider from "@/components/marketing/MotionProvider";
import { SITE_URL, buildMetadata, organizationJsonLd, webSiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "QTS - Hạ tầng số cho tăng trưởng doanh nghiệp",
    description:
      "QTS phát triển nền tảng phần mềm, ứng dụng doanh nghiệp và hệ sinh thái số thông minh có khả năng mở rộng.",
    path: "/",
  }),
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationJsonLd(), webSiteJsonLd()]).replace(/</g, "\\u003c") }}
        />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

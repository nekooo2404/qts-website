import type { Metadata } from "next";
import "animate.css/animate.min.css";
import "./globals.css";
import MotionProvider from "@/components/marketing/MotionProvider";

export const metadata: Metadata = {
  title: "QTS — Digital infrastructure for enterprise growth",
  description:
    "QTS builds scalable software platforms, enterprise applications and intelligent digital ecosystems.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

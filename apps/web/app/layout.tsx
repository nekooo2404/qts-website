import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import MotionProvider from "@/components/marketing/MotionProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "QTS — Digital infrastructure for enterprise growth",
  description:
    "QTS builds scalable software platforms, enterprise applications and intelligent digital ecosystems.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
      </head>
      <body className={`${geist.variable} ${inter.variable}`}>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

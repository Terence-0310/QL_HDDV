import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SWRProvider } from "@/components/providers/swr-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hệ thống quản lý hợp đồng",
  description: "Nền tảng quản lý hợp đồng điện tử và nhắc mốc gia hạn",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi">
      <body>
        <SWRProvider>
          {children}
        </SWRProvider>
      </body>
    </html>
  );
}

import "./globals.css";
import type { Metadata } from "next";
import { TopNav } from "../components/TopNav";

export const metadata: Metadata = {
  title: "BetterCV — AI Resume Builder",
  description: "Tạo CV chuẩn ATS với AI. Template đẹp, quét từ khóa, xuất PDF chuyên nghiệp."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}

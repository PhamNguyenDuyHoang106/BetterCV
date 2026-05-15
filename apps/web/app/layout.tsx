import "./globals.css";
import type { Metadata } from "next";
import { TopNav } from "../components/TopNav";

export const metadata: Metadata = {
  title: "AI CV Builder",
  description: "AI-powered CV Builder & Editor"
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

import "./globals.css";
import type { Metadata } from "next";
import { TopNav } from "../components/TopNav";
import GoogleAnalytics from "../components/GoogleAnalytics";
import { Inter, Manrope, Plus_Jakarta_Sans, Playfair_Display, Cormorant_Garamond } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
  weight: ["500", "600", "700"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  variable: "--font-cormorant",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BetterCV — AI Resume Builder",
  description: "Tạo CV chuẩn ATS với AI. Template đẹp, quét từ khóa, xuất PDF chuyên nghiệp."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${manrope.variable} ${plusJakartaSans.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('acv-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var path = window.location.pathname;
                  var isPublicPage = path === '/' || path === '/auth' || path === '/login' || path === '/register';
                  if (!isPublicPage && (saved === 'dark' || (!saved && prefersDark))) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <GoogleAnalytics />
        <TopNav />
        {children}
        <UpgradeModalProvider />
      </body>
    </html>
  );
}

import { UpgradeModalProvider } from "../components/UpgradeModalProvider";


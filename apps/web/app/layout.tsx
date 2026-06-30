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
        <TopNav />
        {children}
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen auth-page-bg flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-sky-200/20 blur-[100px]" />
      </div>

      <div className="auth-card w-full max-w-md relative z-10 overflow-hidden">
        <div className="pt-9 pb-6 px-8 text-center border-b border-slate-100/90 bg-gradient-to-b from-white to-slate-50/50">
          <Link href="/" className="inline-block group">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary via-[#0077b6] to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/25 group-hover:scale-[1.02] transition-transform">
              <span className="text-white text-2xl font-bold tracking-tight">BC</span>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-[1.65rem] font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">{subtitle}</p>
        </div>

        <div className="p-7 sm:p-8">{children}</div>

        <div className="py-5 px-8 text-center border-t border-slate-100 bg-slate-50/80">{footer}</div>
      </div>
    </div>
  );
}

export function AuthDivider({ label = "HOẶC" }: { label?: string }) {
  return (
    <div className="relative flex items-center justify-center my-6">
      <div className="absolute w-full h-px bg-slate-200" />
      <span className="relative bg-white px-4 text-xs font-semibold text-slate-400 tracking-wider">
        {label}
      </span>
    </div>
  );
}

export const authInputClass =
  "auth-input w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all";

export const authLabelClass = "block text-sm font-medium text-slate-700 mb-1.5";

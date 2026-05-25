"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { syncSessionToApp } from "../../../../lib/auth-session";

export default function AuthCallbackSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Đang hoàn tất đăng nhập...");

  useEffect(() => {
    const next = searchParams.get("next") || "/dashboard";

    syncSessionToApp()
      .then((profile) => {
        if (profile) {
          router.replace(next);
        } else {
          setMessage("Không lấy được phiên đăng nhập.");
          setTimeout(() => router.replace("/login"), 2000);
        }
      })
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : "Đăng nhập thất bại");
        setTimeout(() => router.replace("/login"), 2500);
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen auth-page-bg flex items-center justify-center p-6">
      <div className="auth-card max-w-sm w-full p-10 text-center">
        <div className="mx-auto w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  );
}

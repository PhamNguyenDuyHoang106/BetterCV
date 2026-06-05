"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginFormClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth?mode=login");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen auth-page-bg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

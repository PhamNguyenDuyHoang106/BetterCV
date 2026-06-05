import { Suspense } from "react";
import UnifiedAuthContent from "./UnifiedAuthContent";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen auth-page-bg flex items-center justify-center p-6">
          <div className="auth-card max-w-sm w-full p-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">Đang tải...</p>
          </div>
        </div>
      }
    >
      <UnifiedAuthContent />
    </Suspense>
  );
}

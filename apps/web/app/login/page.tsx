import { Suspense } from "react";
import LoginFormClient from "./LoginFormClient";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginFormClient />
    </Suspense>
  );
}

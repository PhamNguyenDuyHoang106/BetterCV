"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "../lib/store/auth";
import { createSupabaseClient } from "../lib/supabase";

export const TopNav = () => {
  const { accessToken, user, clear, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Continue with local clear even if Supabase sign-out fails
    }
    clear();
  };

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <Link href="/" className="text-lg font-semibold">
        BetterCV
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/dashboard">Dashboard</Link>
        {accessToken ? (
          <>
            {user && (
              <span className="text-slate-500">{user.fullName}</span>
            )}
            <button
              className="rounded-md border border-slate-300 px-3 py-1"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link
              href="/register"
              className="rounded-md bg-slate-900 px-3 py-1 text-white"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

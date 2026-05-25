"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { createSupabaseClient } from "../../lib/supabase";
import { useAuthStore } from "../../lib/store/auth";
import { apiFetch } from "../../lib/api";
import {
  AuthDivider,
  AuthShell,
  authInputClass,
  authLabelClass,
} from "../../components/auth/AuthShell";
import { GoogleAuthButton } from "../../components/auth/GoogleAuthButton";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) setError(decodeURIComponent(oauthError));
  }, [searchParams]);

  const onSubmit = async (values: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError || !data.session) {
        setError(authError?.message ?? "Login failed");
        return;
      }

      useAuthStore.setState({ accessToken: data.session.access_token });
      const profile = await apiFetch<{
        id: string;
        email: string;
        fullName: string;
        role: string;
      }>("/auth/me");

      setAuth(data.session.access_token, profile);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back!"
      subtitle="Please log in to continue building your CV"
      footer={
        <p className="text-slate-600 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      }
    >
      <GoogleAuthButton label="Log in with Google" redirectPath="/dashboard" />
      <AuthDivider label="OR" />

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className={authLabelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className={authInputClass}
            {...register("email", { required: "Email is required." })}
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className={authLabelClass} htmlFor="password">
              Password
            </label>
            <a
              href="#"
              className="text-primary text-xs font-semibold hover:underline"
            >
              Forgot Password?
            </a>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`${authInputClass} pr-12`}
              {...register("password", { required: "Password is required." })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-red-600 flex items-center gap-1 bg-red-50 px-3 py-2 rounded-xl">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </p>
        )}

        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
          />
          <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">
            Remember me
          </span>
        </label>

        <button type="submit" disabled={loading} className="auth-primary-btn">
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </AuthShell>
  );
}

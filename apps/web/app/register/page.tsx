"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

type RegisterForm = {
  fullName: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const onSubmit = async (values: RegisterForm) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!data.session) {
        setSuccessEmail(values.email);
        return;
      }

      const token = data.session.access_token;
      useAuthStore.setState({ accessToken: token });

      const res = await apiFetch<any>("/auth/sync", {
        method: "POST",
        body: JSON.stringify({ fullName: values.fullName }),
      });
      const profile = res?.data || res;

      setAuth(token, profile);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (successEmail) {
    return (
      <AuthShell
        title="Xác nhận email của bạn"
        subtitle="Chúng tôi đã gửi liên kết kích hoạt tài khoản"
        footer={
          <Link href="/login" className="text-primary font-semibold text-sm hover:underline">
            Đi tới Đăng nhập
          </Link>
        }
      >
        <div className="text-center py-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">mark_email_read</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Liên kết xác thực đã gửi tới{" "}
            <strong className="text-slate-900">{successEmail}</strong>. Kiểm tra hộp thư đến và
            mục Spam/Thư rác trước khi đăng nhập.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Start building ATS-friendly resumes today"
      footer={
        <p className="text-slate-600 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <GoogleAuthButton label="Sign up with Google" redirectPath="/dashboard" />
      <AuthDivider label="OR" />

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className={authLabelClass} htmlFor="fullName">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="Alex Mercer"
            className={authInputClass}
            {...register("fullName", { required: "Full name is required." })}
          />
          {errors.fullName && (
            <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>
          )}
        </div>

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
          <label className={authLabelClass} htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`${authInputClass} pr-12`}
              {...register("password", {
                required: "Password is required.",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters.",
                },
              })}
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

        <button type="submit" disabled={loading} className="auth-primary-btn">
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </AuthShell>
  );
}

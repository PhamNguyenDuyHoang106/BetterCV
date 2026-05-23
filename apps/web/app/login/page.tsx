"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { createSupabaseClient } from "../../lib/supabase";
import { useAuthStore } from "../../lib/store/auth";
import { apiFetch } from "../../lib/api";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      // Sync user to backend and get profile
      const token = data.session.access_token;
      useAuthStore.setState({ accessToken: token });

      const profile = await apiFetch<{
        id: string;
        email: string;
        fullName: string;
        role: string;
      }>("/auth/me");

      setAuth(token, profile);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest text-text-primary min-h-screen flex font-body-md w-full relative overflow-x-hidden">
      {/* Left Column: Marketing / Glassmorphic Aesthetic (Visible only on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-section-gap relative overflow-hidden bg-gradient-to-br from-surface-bright to-surface-container-high radial-bg">
        {/* Decorative subtle glowing orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary-container/40 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-sm">
              BC
            </div>
            <span className="font-section-title font-bold text-primary text-xl tracking-tight">BetterCV</span>
          </Link>
        </div>
        
        <div className="relative z-10 flex-grow flex items-center justify-center">
          {/* Glassmorphism Card */}
          <div className="glass-panel rounded-xl p-8 max-w-lg w-full flex flex-col gap-4 transform hover:-translate-y-1 transition-all duration-300 border border-white/50 shadow-lg">
            {/* ATS Score Badge */}
            <div className="self-start inline-flex items-center gap-2 bg-white/60 rounded-full px-4 py-2 border border-white/50 shadow-sm backdrop-blur-md">
              <span className="material-symbols-outlined text-[#10b981] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="font-label-md text-xs font-semibold text-text-primary">ATS Score</span>
              <span className="font-label-md text-xs text-[#10b981] font-bold ml-2">95 / 100</span>
            </div>
            {/* Testimonial */}
            <p className="font-body-lg text-lg text-text-primary mt-2 leading-relaxed">
              {"\"BetterCV completely transformed my resume. The ATS scanner gave me the confidence to apply, and I got the job!\""}
            </p>
            {/* Citation */}
            <p className="font-label-md text-xs font-bold text-text-secondary mt-1 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-outline-variant inline-block"></span>
              {"Sarah Jenkins, Software Engineer at Tech Corp"}
            </p>
          </div>
        </div>
        
        {/* Footer Micro-copy */}
        <div className="relative z-10 mt-auto flex items-center gap-2">
          <p className="font-label-md text-xs text-text-secondary font-bold">
            {"Join 10,000+ professionals who landed jobs using BetterCV."}
          </p>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-surface-container-lowest relative z-20 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Header */}
          <div className="text-center mb-2 flex flex-col items-center">
            <Link href="/" className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-sm mb-4">
              BC
            </Link>
            <h1 className="font-section-title text-3xl font-bold text-text-primary">{"Welcome back"}</h1>
            <p className="font-body-md text-sm text-text-secondary mt-2">{"Enter your credentials to access your account."}</p>
          </div>

          {/* Social Auth */}
          <div className="flex gap-4 w-full">
            <button
              onClick={() => alert("Google SSO is coming soon!")}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[rgba(185,217,235,0.2)] border border-white/40 text-primary font-semibold text-sm hover:bg-surface-variant transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-lg">globe</span>
              Google
            </button>
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="h-[1px] flex-1 bg-outline-variant"></div>
            <span className="font-label-sm text-xs text-text-secondary uppercase tracking-wider font-semibold">{"or sign in with email"}</span>
            <div className="h-[1px] flex-1 bg-outline-variant"></div>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-xs font-semibold text-text-secondary" htmlFor="email">Email</label>
              <input
                id="email"
                placeholder="you@example.com"
                type="email"
                className="frosted-input w-full px-4 py-3 rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                {...register("email", { required: "Email is required." })}
              />
              {errors.email && (
                <p className="text-xs text-error mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-xs font-semibold text-text-secondary" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  className="frosted-input w-full px-4 py-3 rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                  {...register("password", { required: "Password is required." })}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors p-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-error mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <p className="font-label-sm text-xs font-bold text-error mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </p>
            )}

            {/* Options */}
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  className="peer h-4 w-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary focus:ring-offset-surface-container-lowest transition-all"
                  type="checkbox"
                />
                <span className="font-label-md text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">{"Remember me"}</span>
              </label>
              <a className="font-label-md text-xs font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors hover:underline" href="#">{"Forgot Password?"}</a>
            </div>

            {/* Submit */}
            <button
              disabled={loading}
              className="w-full mt-4 py-3 px-6 rounded-full bg-primary text-on-primary font-bold text-sm hover:shadow-[0_0_15px_rgba(93,173,226,0.4)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
              type="submit"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center font-body-md text-sm text-text-secondary mt-4">
            {"Don't have an account?"}
            <Link className="text-primary font-bold hover:underline ml-1.5" href="/register">
              {"Sign up"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { createSupabaseClient } from "../../lib/supabase";
import { useAuthStore } from "../../lib/store/auth";
import { apiFetch } from "../../lib/api";

type RegisterForm = {
  fullName: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();
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
        // If email confirmation is enabled, Supabase creates the user but returns no session
        setSuccessEmail(values.email);
        return;
      }

      // Sync user to backend
      const token = data.session.access_token;
      useAuthStore.setState({ accessToken: token });

      const profile = await apiFetch<{
        id: string;
        email: string;
        fullName: string;
        role: string;
      }>("/auth/sync", {
        method: "POST",
        body: JSON.stringify({ fullName: values.fullName }),
      });

      setAuth(token, profile);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
            {/* Benefits Badge */}
            <div className="self-start inline-flex items-center gap-2 bg-white/60 rounded-full px-4 py-2 border border-white/50 shadow-sm backdrop-blur-md">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="font-label-md text-xs font-semibold text-text-primary">Free Optimization</span>
              <span className="font-label-md text-xs text-primary font-bold ml-2">Unlimited Drafts</span>
            </div>
            {/* Benefit Statement */}
            <p className="font-body-lg text-lg text-text-primary mt-2 leading-relaxed">
              {"\"Get immediate ATS score matching, dynamic rewrite suggestions, and tailor your profile to top company requirements instantly.\""}
            </p>
            {/* Citations */}
            <p className="font-label-md text-xs font-bold text-text-secondary mt-1 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-outline-variant inline-block"></span>
              {"Accelerate your job application process"}
            </p>
          </div>
        </div>
        
        {/* Footer Micro-copy */}
        <div className="relative z-10 mt-auto flex items-center gap-2">
          <p className="font-label-md text-xs text-text-secondary font-bold">
            {"Join thousands of job seekers landing interviews today."}
          </p>
        </div>
      </div>

      {/* Right Column: Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-surface-container-lowest relative z-20 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-md flex flex-col gap-6">
          {successEmail ? (
            <div className="text-center flex flex-col items-center gap-6 py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce">
                <span className="material-symbols-outlined text-3xl">mark_email_read</span>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="font-section-title text-2xl font-bold text-text-primary">Xác nhận email của bạn</h1>
                <p className="font-body-md text-sm text-text-secondary leading-relaxed">
                  Chúng tôi đã gửi một liên kết xác thực đến <strong className="text-text-primary">{successEmail}</strong>.
                </p>
                <p className="font-body-md text-sm text-text-secondary leading-relaxed">
                  Vui lòng kiểm tra hộp thư đến (và cả mục <strong>Spam/Thư rác</strong>) để kích hoạt tài khoản trước khi đăng nhập.
                </p>
              </div>
              
              <Link 
                href="/login" 
                className="w-full mt-4 py-3 px-6 rounded-full bg-primary text-on-primary font-bold text-sm text-center hover:shadow-[0_0_15px_rgba(93,173,226,0.4)] hover:-translate-y-0.5 transition-all duration-200"
              >
                Đi tới Đăng nhập
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-2 flex flex-col items-center">
                <Link href="/" className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-sm mb-4">
                  BC
                </Link>
                <h1 className="font-section-title text-3xl font-bold text-text-primary">{"Create account"}</h1>
                <p className="font-body-md text-sm text-text-secondary mt-2">{"Start building ATS-friendly resumes today."}</p>
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
                <span className="font-label-sm text-xs text-text-secondary uppercase tracking-wider font-semibold">{"or sign up with email"}</span>
                <div className="h-[1px] flex-1 bg-outline-variant"></div>
              </div>

              {/* Form */}
              <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit(onSubmit)}>
                {/* Full Name */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-xs font-semibold text-text-secondary" htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    placeholder="Alex Mercer"
                    type="text"
                    className="frosted-input w-full px-4 py-3 rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                    {...register("fullName", { required: "Full name is required." })}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-error mt-1">{errors.fullName.message}</p>
                  )}
                </div>

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
                      {...register("password", {
                        required: "Password is required.",
                        minLength: { value: 6, message: "Password must be at least 6 characters." }
                      })}
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

                {/* Submit */}
                <button
                  disabled={loading}
                  className="w-full mt-4 py-3 px-6 rounded-full bg-primary text-on-primary font-bold text-sm hover:shadow-[0_0_15px_rgba(93,173,226,0.4)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                  type="submit"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              {/* Toggle */}
              <p className="text-center font-body-md text-sm text-text-secondary mt-4">
                {"Already have an account?"}
                <Link className="text-primary font-bold hover:underline ml-1.5" href="/login">
                  {"Sign in"}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

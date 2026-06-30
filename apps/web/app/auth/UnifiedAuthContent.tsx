"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { createSupabaseClient } from "../../lib/supabase";
import { useAuthStore } from "../../lib/store/auth";
import { apiFetch } from "../../lib/api";
import { syncSessionToApp } from "../../lib/auth-session";
import { GoogleAuthButton } from "../../components/auth/GoogleAuthButton";
import { useLanguageStore } from "../../lib/store/language";
import { translations } from "../../lib/translations";
import { LanguageDropdown } from "../../components/LanguageDropdown";
import { useThemeStore } from "../../lib/store/theme";

type EmailForm = {
  email: string;
  password: string;
  fullName: string;
};

export default function UnifiedAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { language } = useLanguageStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const html = document.documentElement;
      html.classList.remove("dark");
    }
    return () => {
      if (typeof window !== "undefined" && theme === "dark") {
        document.documentElement.classList.add("dark");
      }
    };
  }, [theme]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailForm>();

  const [mounted, setMounted] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const redirectPath = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) setError(decodeURIComponent(oauthError));

    const initialMode = searchParams.get("mode");
    if (initialMode === "register" || initialMode === "signup") {
      setIsNewUser(true);
    } else if (initialMode === "login" || initialMode === "signin") {
      setIsNewUser(false);
    }
  }, [searchParams]);

  // Safe translations lookup (default to 'vi' on SSR to avoid hydration mismatch)
  const activeLang = mounted ? language : "vi";
  const t = translations[activeLang];

  const onSubmit = async (values: EmailForm) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();

      if (isNewUser) {
        // ── Register flow ──
        const { data, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { full_name: values.fullName },
          },
        });

        if (authError) {
          const msg = authError.message.toLowerCase();
          if (
            msg.includes("already registered") ||
            msg.includes("already been registered")
          ) {
            setError(t.auth.errorEmailExists);
            setIsNewUser(false);
          } else {
            setError(authError.message);
          }
          return;
        }

        if (
          data.user &&
          !data.session &&
          data.user.identities?.length === 0
        ) {
          setError(t.auth.errorEmailExists);
          setIsNewUser(false);
          return;
        }

        if (!data.session) {
          setSuccessEmail(values.email);
          return;
        }

        useAuthStore.setState({ accessToken: data.session.access_token });
        const profile = await syncSessionToApp(values.fullName);
        if (!profile) {
          setError(t.auth.errorSync);
          return;
        }

        router.push(redirectPath);
      } else {
        // ── Login flow ──
        const { data, error: authError } =
          await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
          });

        if (authError || !data.session) {
          setError(authError?.message ?? t.auth.errorLoginFailed);
          return;
        }

        useAuthStore.setState({ accessToken: data.session.access_token });
        const res = await apiFetch<any>("/auth/me");
        const profile = res?.data || res;

        setAuth(data.session.access_token, profile);
        router.push(redirectPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  /* ── Email verification success ── */
  if (successEmail) {
    return (
      <div className="min-h-screen auth-page-bg flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-primary-dark/15 blur-3xl" />
        </div>
        <div className="auth-unified-card w-full max-w-md relative z-10 p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">
              mark_email_read
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t.auth.successTitle}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {t.auth.successDesc.replace("{email}", successEmail)}
          </p>
          <button
            type="button"
            className="text-primary font-semibold text-sm hover:underline"
            onClick={() => {
              setSuccessEmail(null);
              setIsNewUser(false);
            }}
          >
            {t.auth.successBackBtn}
          </button>
        </div>
      </div>
    );
  }

  /* ── Main auth UI ── */
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 w-full bg-slate-50 overflow-hidden">
      
      {/* ── Left Column (Value Prop & Mockup) ── */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 auth-left-column relative text-white select-none">
        {/* Background Grid Pattern */}
        <div className="auth-left-grid" />
        
        {/* Top: Logo & Brand */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary-dark to-primary-darker rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-[1.02] transition-transform">
              <span className="text-on-primary text-base font-bold">BC</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">BetterCV</span>
          </Link>
        </div>

        {/* Middle: Slogans, Feature List & Mockup */}
        <div className="relative z-10 my-auto py-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              {t.auth.leftTitle} <br />
              <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                {t.auth.leftSub}
              </span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              {t.auth.leftDesc}
            </p>
          </div>

          {/* Features list */}
          <ul className="mt-8 space-y-4">
            {t.auth.leftFeatures.map((feat, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-green-400 mt-0.5 select-none font-bold text-lg">
                  check_circle
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm">{feat.title}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">{feat.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* CV Mockup */}
          <div className="mt-10 auth-cv-mockup select-none">
            <div className="auth-cv-mockup-inner w-full max-w-xs bg-slate-900 border border-slate-700/60 rounded-2xl p-5 relative text-left">
              {/* AI Optimized Badge */}
              <div className="absolute -top-3 -right-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all select-none pulse-glow cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 inline-block animate-ping animate-duration-1000" />
                AI OPTIMIZED
              </div>
              
              {/* Mock CV Contents */}
              <div className="space-y-4">
                {/* Name and title */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-slate-300 text-xs font-bold font-mono">
                    JD
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-24 bg-slate-300 rounded-sm" />
                    <div className="h-2 w-32 bg-slate-500 rounded-sm" />
                  </div>
                </div>
                
                {/* Divider */}
                <div className="h-px bg-slate-700/50" />
                
                {/* Experience Blocks */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="h-2 w-28 bg-slate-300 rounded-sm" />
                      <div className="h-1.5 w-16 bg-slate-500 rounded-sm" />
                    </div>
                    <div className="h-1.5 w-12 bg-slate-600 rounded-sm" />
                  </div>
                  <div className="space-y-1 pl-2.5 border-l border-slate-700">
                    <div className="h-1.5 w-full bg-slate-500/80 rounded-sm" />
                    <div className="h-1.5 w-11/12 bg-slate-500/80 rounded-sm" />
                  </div>
                </div>

                {/* Circular ATS Gauge */}
                <div className="mt-3 flex items-center gap-3 bg-slate-950/60 border border-slate-700/40 rounded-xl p-2.5">
                  <div className="circular-gauge w-10 h-10 shrink-0">
                    <div className="circular-gauge-text text-[10px] font-extrabold text-green-400">94%</div>
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">{t.auth.leftMockupAts}</h5>
                    <p className="text-[9px] text-slate-400">{t.auth.leftMockupDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Social Proof Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
          <div className="space-y-0.5">
            <div className="text-base font-extrabold text-white">2.000+</div>
            <div className="text-[9px] text-slate-400 font-medium">{t.hero.statsCvCreated}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-base font-extrabold text-white">87%</div>
            <div className="text-[9px] text-slate-400 font-medium">{t.hero.statsAtsImprove}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-base font-extrabold text-white">4.9/5★</div>
            <div className="text-[9px] text-slate-400 font-medium">{t.hero.statsRating}</div>
          </div>
        </div>
      </div>

      {/* ── Right Column (Unified Auth Card) ── */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center p-6 sm:p-12 md:p-16 relative overflow-hidden bg-slate-50 min-h-screen">
        {/* Language Selector Dropdown */}
        <div className="absolute top-6 right-6 z-20">
          <LanguageDropdown />
        </div>

        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-primary-dark/10 blur-3xl" />
        </div>

        {/* Mobile Header (Brand identity only on mobile) */}
        <div className="lg:hidden text-center mb-8 flex flex-col items-center justify-center relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary via-primary-dark to-primary-darker rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-on-primary text-sm font-bold font-sans">BC</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">BetterCV</span>
          </Link>
        </div>

        {/* Center Card Wrapper */}
        <div className="w-full max-w-md mx-auto relative z-10">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-100/50">
            {/* Form Title & Slogan */}
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {isNewUser ? t.auth.titleRegister : t.auth.titleLogin}
              </h1>
              <p className="text-slate-500 mt-2.5 text-sm sm:text-base leading-relaxed">
                {isNewUser ? t.auth.subtitleRegister : t.auth.subtitleLogin}
              </p>
            </div>

            {/* Google Login — Primary */}
            <GoogleAuthButton
              label={t.auth.googleBtn}
              redirectPath={redirectPath}
            />

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute w-full h-px bg-slate-200" />
              <span className="relative bg-white/95 px-4 text-[10px] font-bold text-slate-400 tracking-wider">
                {t.auth.or}
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Full Name — only for new users with slide transition */}
              <div className={`auth-name-field ${isNewUser ? "show" : ""}`}>
                <label
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                  htmlFor="auth-fullName"
                >
                  {t.auth.nameLabel}
                </label>
                <input
                  id="auth-fullName"
                  type="text"
                  placeholder={t.auth.namePlaceholder}
                  className="auth-input w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  {...register("fullName", {
                    required: isNewUser ? t.validation.nameRequired : false,
                  })}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                  htmlFor="auth-email"
                >
                  {t.auth.emailLabel}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  className="auth-input w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  {...register("email", {
                    required: t.validation.emailRequired,
                  })}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                  htmlFor="auth-password"
                >
                  {t.auth.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.auth.passwordPlaceholder}
                    className="auth-input w-full px-4 py-3 pr-12 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    {...register("password", {
                      required: t.validation.passwordRequired,
                      minLength: isNewUser
                        ? {
                            value: 6,
                            message: t.validation.passwordTooShort,
                          }
                        : undefined,
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={
                      showPassword ? t.auth.passwordHide : t.auth.passwordShow
                    }
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1 bg-red-50 px-3 py-2 rounded-xl">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 active:scale-[0.99] border-none mt-2"
              >
                {loading
                  ? t.auth.processing
                  : isNewUser
                  ? t.auth.submitRegister
                  : t.auth.submitLogin}
              </button>
            </form>

            {/* Toggle login/register */}
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsNewUser(!isNewUser);
                  setError(null);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                {isNewUser ? t.auth.toggleLogin : t.auth.toggleRegister}
              </button>
            </div>
          </div>

          {/* Footer Terms */}
          <p className="text-[11px] text-slate-400 leading-relaxed text-center mt-6">
            {t.auth.termsText}
            <a href="#" className="text-slate-500 hover:text-emerald-700 hover:underline transition-colors font-medium">
              {t.auth.termsLink}
            </a>{" "}
            {activeLang === "vi" ? "và" : "and"}{" "}
            <a href="#" className="text-slate-500 hover:text-emerald-700 hover:underline transition-colors font-medium">
              {t.auth.privacyLink}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

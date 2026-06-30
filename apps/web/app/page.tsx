"use client";

import Link from "next/link";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../lib/store/auth";
import { createSupabaseClient } from "../lib/supabase";
import { apiFetch } from "../lib/api";
import { useLanguageStore } from "../lib/store/language";
import { translations } from "../lib/translations";
import { LanguageDropdown } from "../components/LanguageDropdown";
import { useThemeStore } from "../lib/store/theme";

/* ── Static Icon Mapping Arrays ── */

const PAIN_POINTS_ICONS = ["block", "search_off", "content_copy"];

const SOLUTION_STEPS_ICONS = ["upload_file", "analytics", "auto_awesome", "download"];

const PRICING_PLANS_METADATA = [
  {
    cardClass: "",
    ctaClass: "dash-btn-ghost w-full text-center",
  },
  {
    cardClass: "landing-price-card-pro",
    ctaClass: "auth-primary-btn text-center",
  },
  {
    cardClass: "",
    ctaClass: "dash-btn-ghost w-full text-center border-primary/40 hover:bg-primary/10",
  },
];

/* ── Animated Counter Hook ── */
function useAnimatedCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

/* ── Component ── */

function HomePageContent() {
  const { accessToken, user, hydrate, clear } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage } = useLanguageStore();

  const [mounted, setMounted] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [profileOpen, setProfileOpen] = useState(false);

  // ATS demo animation
  const [demoActive, setDemoActive] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  const cvCounter = useAnimatedCounter(2000);
  const atsCounter = useAnimatedCounter(87);

  // Auth Card states
  const [cvCount, setCvCount] = useState<number | null>(null);

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

  useEffect(() => {
    setMounted(true);
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (accessToken) {
      apiFetch<any>("/cvs")
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data || [];
          setCvCount(list.length);
        })
        .catch(() => {});
    }
  }, [accessToken]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setProfileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Trigger ATS demo animation on scroll
  useEffect(() => {
    const el = demoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDemoActive(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    clear();
    setProfileOpen(false);
  };

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ME";

  const authHref = accessToken ? "/dashboard" : "/auth";

  // Safe translations lookup (default to 'vi' on SSR to avoid hydration mismatch)
  const activeLang = mounted ? language : "vi";
  const t = translations[activeLang];

  // Derived lists mapped with dynamic translated labels
  const painPointsItems = t.painPoints.items.map((item, idx) => ({
    ...item,
    icon: PAIN_POINTS_ICONS[idx] || "check",
  }));

  const solutionStepsItems = t.steps.items.map((item, idx) => ({
    ...item,
    icon: SOLUTION_STEPS_ICONS[idx] || "check",
  }));

  const pricingPlansItems = t.pricing.plans.map((plan, idx) => ({
    ...plan,
    cardClass: PRICING_PLANS_METADATA[idx]?.cardClass || "",
    ctaClass: PRICING_PLANS_METADATA[idx]?.ctaClass || "",
  }));

  return (
    <div className="bg-background text-text-primary antialiased min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-landing-mesh z-0" />
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-5%] w-[480px] h-[480px] bg-primary/25 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[520px] h-[520px] bg-primary-dark/15 rounded-full blur-3xl" />
      </div>

      {/* ── NAV ── */}
      <nav className="sticky top-0 w-full z-50 bg-glass-bg/90 backdrop-blur-xl border-b border-primary/20 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-primary-darker flex items-center justify-center text-on-primary font-bold text-lg shadow-md">
              BC
            </div>
            <span className="font-bold text-primary-darker text-xl tracking-tight">
              BetterCV
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-text-secondary">
            <a
              className="hover:text-primary-darker transition-colors"
              href="#vi-sao"
            >
              {t.nav.why}
            </a>
            <a
              className="hover:text-primary-darker transition-colors"
              href="#ats-demo"
            >
              {t.nav.demo}
            </a>
            <a
              className="hover:text-primary-darker transition-colors"
              href="#bang-gia"
            >
              {t.nav.pricing}
            </a>
            <a
              className="hover:text-primary-darker transition-colors"
              href="#faq"
            >
              {t.nav.faq}
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <LanguageDropdown />

            {accessToken ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 border border-primary/35 bg-white/70 hover:bg-white transition-all shadow-sm"
                  aria-label={t.nav.myAccount}
                >
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-primary via-primary-dark to-primary-darker flex items-center justify-center text-on-primary font-bold text-xs shadow-sm">
                    {initials}
                  </span>
                  <span className="hidden sm:block text-left">
                    <span className="block text-xs font-bold text-slate-900 leading-none max-w-[140px] truncate">
                      {user?.fullName || "BetterCV User"}
                    </span>
                    <span className="block text-[10px] text-slate-500 leading-none mt-0.5">
                      {user?.role || "FREE"}
                    </span>
                  </span>
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">
                    expand_more
                  </span>
                </button>

                {profileOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40"
                      aria-label={t.nav.close}
                      onClick={() => setProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 z-50 rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-xl overflow-hidden">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary-darker">
                          dashboard
                        </span>
                        {t.nav.dashboard}
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          logout
                        </span>
                        {t.nav.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth?mode=login"
                  className="text-sm font-bold text-primary-darker hover:text-primary transition-colors px-4 py-2"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/auth?mode=register"
                  className="text-sm font-bold bg-primary text-on-primary rounded-xl px-6 py-2.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  {t.nav.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow relative z-10">
        {/* ═══════════ SECTION 1: HERO ═══════════ */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="flex flex-col gap-7">
              <div className="inline-flex self-start items-center gap-2 bg-primary/30 rounded-full px-4 py-1.5 border border-primary/50 text-xs font-bold text-primary-darker uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">bolt</span>
                {t.hero.badge}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-text-primary leading-[1.1] tracking-tight">
                {t.hero.titleLine1}{" "}
                <span className="text-primary-darker">
                  {t.hero.titleLine2}
                </span>
              </h1>
              <p className="text-lg text-text-secondary max-w-lg leading-relaxed">
                {t.hero.desc}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={authHref}
                  className="inline-flex items-center gap-2 text-sm font-bold bg-primary text-on-primary rounded-xl px-8 py-3.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <span className="material-symbols-outlined">
                    rocket_launch
                  </span>
                  {t.hero.ctaFree}
                </Link>
                <a
                  href="#ats-demo"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-darker bg-white/60 border border-primary/30 rounded-xl px-8 py-3.5 hover:bg-white transition-all"
                >
                  <span className="material-symbols-outlined text-lg">
                    play_circle
                  </span>
                  {t.hero.ctaDemo}
                </a>
              </div>
            </div>

            {/* Right-hand Column (Mockup or Welcome Back Card) */}
            <div className="relative">
              {/* Decorative blurred blob */}
              <div className="absolute inset-4 rounded-3xl bg-gradient-to-br from-primary/40 via-primary-dark/20 to-transparent blur-2xl pointer-events-none" />

              {/* ── PREMIUM CV MOCKUP ── */}
              <div className="relative h-[400px] md:h-[460px]">
                <div className="glass-panel absolute inset-0 rounded-2xl p-6 flex flex-col gap-4 border border-white/60 shadow-2xl z-10">
                  <div className="flex items-center gap-2 border-b border-glass-border pb-3">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-text-secondary ml-2 font-mono">
                      nguyen_van_a_cv.pdf
                    </span>
                  </div>
                  <div className="w-2/5 h-3 rounded bg-primary/40" />
                  <div className="w-4/5 h-7 rounded-lg bg-surface-variant" />
                  <div className="space-y-2 flex-1">
                    {[100, 95, 88, 92].map((w) => (
                      <div
                        key={w}
                        className="h-2 rounded bg-tertiary-fixed"
                        style={{ width: `${w}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-glass-border">
                    <span className="text-xs font-semibold text-text-secondary">
                      {t.hero.mockup.atsScore}
                    </span>
                    <span className="text-lg font-extrabold text-primary-darker">
                      94%
                    </span>
                  </div>
                </div>

                <div
                  className="absolute -top-2 right-0 lg:right-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-primary/20 z-20"
                  style={{ animation: "gallery-fade-in 0.6s ease-out" }}
                >
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
                    94
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      {t.hero.mockup.atsScore}
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      {t.hero.mockup.excellentMatch}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-4 left-0 lg:-left-4 glass-panel rounded-2xl p-4 w-56 shadow-xl border border-white/50 z-20">
                  <div className="flex items-center gap-1.5 mb-2 text-primary-darker">
                    <span className="material-symbols-outlined text-sm">
                      auto_awesome
                    </span>
                    <span className="text-xs font-bold">{t.hero.mockup.aiSuggestion}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {t.hero.mockup.aiSuggestionDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ SECTION 2: SOCIAL PROOF ═══════════ */}
        <section className="border-y border-primary/15 bg-white/40 backdrop-blur-sm py-10">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="counter-stat" ref={cvCounter.ref}>
              <p className="text-3xl font-extrabold text-primary-darker">
                {cvCounter.count.toLocaleString()}+
              </p>
              <p className="text-sm font-semibold text-text-secondary mt-1">
                {t.hero.statsCvCreated}
              </p>
            </div>
            <div className="counter-stat" ref={atsCounter.ref}>
              <p className="text-3xl font-extrabold text-primary-darker">
                {atsCounter.count}%
              </p>
              <p className="text-sm font-semibold text-text-secondary mt-1">
                {t.hero.statsAtsImprove}
              </p>
            </div>
            <div className="counter-stat">
              <p className="text-3xl font-extrabold text-primary-darker">
                4.9★
              </p>
              <p className="text-sm font-semibold text-text-secondary mt-1">
                {t.hero.statsRating}
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════ SECTION 3: PAIN POINTS ═══════════ */}
        <section id="vi-sao" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">
              {t.painPoints.badge}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              {t.painPoints.title}
            </h2>
            <p className="text-text-secondary mt-4 leading-relaxed">
              {t.painPoints.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {painPointsItems.map((pain) => (
              <div key={pain.title} className="pain-card">
                <div className="pain-card-icon">
                  <span className="material-symbols-outlined">
                    {pain.icon}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {pain.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {pain.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ SECTION 4: SOLUTION FLOW ═══════════ */}
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="rounded-3xl bg-gradient-to-br from-primary-darker via-[#2d5a38] to-[#1e3d28] p-10 md:p-14 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">
                {t.steps.badge}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {t.steps.title}
              </h2>
              <p className="text-white/70 mb-10 max-w-lg">
                {t.steps.desc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {solutionStepsItems.map((s, i) => (
                  <div
                    key={s.title}
                    className="solution-step border border-white/15 rounded-2xl p-6 bg-white/5 backdrop-blur-sm"
                  >
                    <div className="solution-step-num bg-primary/30 text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <span className="material-symbols-outlined text-3xl text-primary/80 mb-3">
                      {s.icon}
                    </span>
                    <h3 className="text-lg font-bold">{s.title}</h3>
                    <p className="text-sm text-white/70 mt-2 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href={authHref}
                className="inline-flex mt-10 items-center gap-2 bg-primary text-on-primary font-bold rounded-xl px-8 py-3.5 hover:brightness-105 transition-all"
              >
                {t.steps.cta}
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════ SECTION 5: ATS DEMO ═══════════ */}
        <section
          id="ats-demo"
          className="max-w-6xl mx-auto px-6 py-16 md:py-24"
          ref={demoRef}
        >
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold text-primary-darker uppercase tracking-widest mb-3">
              {t.atsDemo.badge}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              {t.atsDemo.title}
            </h2>
            <p className="text-text-secondary mt-4 leading-relaxed">
              {t.atsDemo.desc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-4 items-center max-w-4xl mx-auto">
            {/* Before */}
            <div className="ats-demo-card ats-demo-before ats-score-low">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-6">
                {t.atsDemo.beforeLabel}
              </p>
              <div className="flex flex-col items-center gap-4">
                <div
                  className="ats-score-ring"
                  style={
                    { "--score": demoActive ? 42 : 0 } as React.CSSProperties
                  }
                >
                  <span>{demoActive ? 42 : 0}</span>
                </div>
                <p className="text-sm font-semibold text-amber-800">
                  {t.atsDemo.scoreWeak}
                </p>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-xs text-amber-700">
                  <span className="material-symbols-outlined text-sm">
                    warning
                  </span>
                  {t.atsDemo.warningKeywords}
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-700">
                  <span className="material-symbols-outlined text-sm">
                    warning
                  </span>
                  {t.atsDemo.warningFormat}
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-700">
                  <span className="material-symbols-outlined text-sm">
                    warning
                  </span>
                  {t.atsDemo.warningGeneric}
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="ats-demo-arrow hidden md:flex flex-col items-center gap-2">
              <span className="material-symbols-outlined">
                arrow_forward
              </span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                BetterCV
              </span>
            </div>
            <div className="ats-demo-arrow flex md:hidden justify-center">
              <span className="material-symbols-outlined rotate-90">
                arrow_forward
              </span>
            </div>

            {/* After */}
            <div className="ats-demo-card ats-demo-after ats-score-high">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-6">
                {t.atsDemo.afterLabel}
              </p>
              <div className="flex flex-col items-center gap-4">
                <div
                  className="ats-score-ring"
                  style={
                    { "--score": demoActive ? 87 : 0 } as React.CSSProperties
                  }
                >
                  <span>{demoActive ? 87 : 0}</span>
                </div>
                <p className="text-sm font-semibold text-emerald-800">
                  {t.atsDemo.scoreExcellent}
                </p>
              </div>
              <div className="mt-6 space-y-2">
                {t.atsDemo.improvements.map((imp) => (
                  <div key={imp} className="ats-improve-tag ats-improve-tag-add">
                    <span className="material-symbols-outlined text-sm">
                      check_circle
                    </span>
                    {imp}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              href={authHref}
              className="inline-flex items-center gap-2 text-sm font-bold bg-primary text-on-primary rounded-xl px-8 py-3.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <span className="material-symbols-outlined">auto_fix_high</span>
              {t.atsDemo.ctaBtn}
            </Link>
          </div>
        </section>

        {/* ═══════════ SECTION 7: PRICING ═══════════ */}
        <section
          id="bang-gia"
          className="max-w-6xl mx-auto px-6 py-16 md:py-24"
        >
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold text-primary-darker uppercase tracking-widest mb-3">
              {t.pricing.badge}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              {t.pricing.title}
            </h2>
            <p className="text-text-secondary mt-4 leading-relaxed">
              {t.pricing.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlansItems.map((plan) => (
              <div
                key={plan.name}
                className={`landing-price-card ${plan.cardClass}`}
              >
                {(plan as any).ribbon && (
                  <div className="landing-price-ribbon">{(plan as any).ribbon}</div>
                )}
                <h3 className="text-xl font-bold text-text-primary mb-1">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="landing-price-value">{plan.price}</span>
                  {plan.period && (
                    <span className="landing-price-period">{plan.period}</span>
                  )}
                </div>
                <div className="flex flex-col gap-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <div key={f} className="landing-feature-check">
                      <span className="material-symbols-outlined">check</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href={authHref} className={plan.ctaClass}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ SECTION 8: TESTIMONIALS ═══════════ */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-text-primary mb-12">
            {t.testimonials.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.testimonials.items.map((t) => (
              <blockquote
                key={t.name}
                className="glass-panel rounded-2xl p-8 border border-white/50 relative"
              >
                <span className="material-symbols-outlined text-primary text-3xl mb-4 block opacity-60">
                  format_quote
                </span>
                <p className="text-text-primary leading-relaxed font-medium">
                  &quot;{t.quote}&quot;
                </p>
                <footer className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/60 flex items-center justify-center text-on-primary font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">
                      {t.name}
                    </p>
                    <p className="text-xs text-text-secondary">{t.role}</p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* ═══════════ SECTION 9: FAQ ═══════════ */}
        <section id="faq" className="max-w-2xl mx-auto px-6 py-12 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-text-primary mb-10">
            {t.faq.title}
          </h2>
          <div className="space-y-3">
            {t.faq.items.map((faq, idx) => (
              <div
                key={idx}
                className="glass-panel rounded-2xl overflow-hidden border border-white/50"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-text-primary hover:bg-primary/10 transition-colors"
                >
                  <span>{faq.question}</span>
                  <span className="material-symbols-outlined text-primary-darker">
                    {activeFaq === idx ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed border-t border-primary/15">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ SECTION 10: FINAL CTA ═══════════ */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="rounded-3xl bg-primary/40 border border-primary/50 p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-landing-mesh opacity-60" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold text-text-primary mb-4">
                {t.finalCta.title}
              </h2>
              <p className="text-text-secondary max-w-lg mx-auto mb-8">
                {t.finalCta.desc}
              </p>
              <Link
                href={authHref}
                className="inline-flex items-center gap-2 bg-primary-darker text-white font-bold rounded-xl px-10 py-4 shadow-lg hover:brightness-110 transition-all"
              >
                {t.finalCta.cta}
                <span className="material-symbols-outlined">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="border-t border-primary/20 bg-surface-container-lowest py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 max-w-6xl mx-auto">
            <div className="col-span-2 md:col-span-1">
              <span className="font-bold text-primary-darker text-xl">
                BetterCV
              </span>
              <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                {t.footer.rights}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-text-primary">
                {t.footer.product}
              </span>
              <a
                className="text-xs text-text-secondary hover:text-primary-darker"
                href="#vi-sao"
              >
                {t.footer.why}
              </a>
              <a
                className="text-xs text-text-secondary hover:text-primary-darker"
                href="#ats-demo"
              >
                {t.atsDemo.badge}
              </a>
              <a
                className="text-xs text-text-secondary hover:text-primary-darker"
                href="#bang-gia"
              >
                {t.pricing.badge}
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-text-primary">
                {t.footer.account}
              </span>
              <Link
                className="text-xs text-text-secondary hover:text-primary-darker"
                href="/auth"
              >
                {t.footer.loginRegister}
              </Link>
              <Link
                className="text-xs text-text-secondary hover:text-primary-darker"
                href="/dashboard"
              >
                {t.nav.dashboard}
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-text-primary">
                {t.footer.support}
              </span>
              <a
                className="text-xs text-text-secondary hover:text-primary-darker"
                href="#faq"
              >
                {t.nav.faq}
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background text-text-primary antialiased min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

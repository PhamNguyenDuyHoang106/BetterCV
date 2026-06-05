"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../lib/store/auth";
import { useTranslation } from "../../hooks/useTranslation";

export default function OnboardingPage() {
  const router = useRouter();
  const { accessToken, user, hydrate } = useAuthStore();
  const { t, language } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [careerStage, setCareerStage] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  useEffect(() => {
    if (mounted && !accessToken) {
      router.replace("/");
    }
  }, [mounted, accessToken, router]);

  const CAREER_STAGES = [
    {
      id: "student",
      icon: "school",
      label: t.onboarding.student,
      desc: t.onboarding.studentDesc,
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "fresh-grad",
      icon: "emoji_objects",
      label: t.onboarding.freshGrad,
      desc: t.onboarding.freshGradDesc,
      color: "bg-amber-50 text-amber-600",
    },
    {
      id: "experienced",
      icon: "work",
      label: t.onboarding.experienced,
      desc: t.onboarding.experiencedDesc,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "career-change",
      icon: "swap_horiz",
      label: t.onboarding.careerChange,
      desc: t.onboarding.careerChangeDesc,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  const INDUSTRIES = [
    { id: "it", icon: "code", label: t.onboarding.industryIt },
    { id: "marketing", icon: "campaign", label: t.onboarding.industryMarketing },
    { id: "business", icon: "business_center", label: t.onboarding.industryBusiness },
    { id: "finance", icon: "account_balance", label: t.onboarding.industryFinance },
    { id: "design", icon: "palette", label: t.onboarding.industryDesign },
    { id: "other", icon: "more_horiz", label: t.onboarding.industryOther },
  ];

  if (!mounted || !accessToken) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleFinish = () => {
    // Save onboarding preferences
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "bettercv_onboarding",
        JSON.stringify({ careerStage, industry, completed: true })
      );
    }
    router.push("/dashboard");
  };

  const namePlaceholder = language === "vi" ? "bạn" : "there";
  const displayName = user?.fullName?.split(" ").pop() || namePlaceholder;

  return (
    <div className="min-h-screen auth-page-bg flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-primary-dark/15 blur-3xl" />
      </div>

      <div className="auth-unified-card w-full max-w-lg relative z-10 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        {/* Header */}
        <div className="pt-8 pb-4 px-8 text-center">
          <Link href="/" className="inline-block group mb-4">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary via-primary-dark to-primary-darker rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-on-primary text-xl font-bold">BC</span>
            </div>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {step === 1
              ? t.onboarding.step1Title.replace("{name}", displayName)
              : t.onboarding.step2Title}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {step === 1
              ? t.onboarding.step1Desc
              : t.onboarding.step2Desc}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 pt-4">
          {step === 1 ? (
            /* ── Step 1: Career Stage ── */
            <div className="grid grid-cols-2 gap-3">
              {CAREER_STAGES.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setCareerStage(stage.id)}
                  className={`onboarding-option ${
                    careerStage === stage.id ? "onboarding-option-active" : ""
                  }`}
                >
                  <div className={`onboarding-icon ${stage.color}`}>
                    <span className="material-symbols-outlined">
                      {stage.icon}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {stage.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{stage.desc}</p>
                </button>
              ))}
            </div>
          ) : (
            /* ── Step 2: Industry ── */
            <div className="grid grid-cols-3 gap-3">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => setIndustry(ind.id)}
                  className={`onboarding-option ${
                    industry === ind.id ? "onboarding-option-active" : ""
                  }`}
                >
                  <div className="onboarding-icon bg-slate-50 text-slate-600">
                    <span className="material-symbols-outlined">
                      {ind.icon}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {ind.label}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 gap-3">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {t.onboarding.skip}
                </button>
                <button
                  type="button"
                  disabled={!careerStage}
                  onClick={() => setStep(2)}
                  className="auth-primary-btn !w-auto px-8 disabled:opacity-40"
                >
                  {t.onboarding.continue}
                  <span className="material-symbols-outlined text-lg ml-1">
                    arrow_forward
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    arrow_back
                  </span>
                  {t.onboarding.back}
                </button>
                <button
                  type="button"
                  disabled={!industry}
                  onClick={handleFinish}
                  className="auth-primary-btn !w-auto px-8 disabled:opacity-40"
                >
                  {t.onboarding.startCreating}
                  <span className="material-symbols-outlined text-lg ml-1">
                    rocket_launch
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

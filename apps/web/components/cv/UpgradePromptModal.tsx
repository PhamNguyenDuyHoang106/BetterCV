"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "../../hooks/useTranslation";

type UpgradePromptModalProps = {
  open: boolean;
  onClose: () => void;
  /** Feature name from API, e.g. "AI.REWRITE" */
  feature?: string;
  /** Required plan tier from API, e.g. "PRO" */
  requiredPlan?: string;
  /** Custom title override */
  title?: string;
  /** Custom description override */
  description?: string;
};

/** Maps raw feature keys to human-readable Vietnamese/English names */
function resolveFeatureName(feature: string | undefined, lang: string): string {
  if (!feature) return lang === "vi" ? "tính năng này" : "this feature";
  const map: Record<string, { vi: string; en: string }> = {
    "AI.REWRITE": { vi: "Viết lại CV bằng AI", en: "AI CV Rewrite" },
    "AI_REWRITE": { vi: "Viết lại CV bằng AI", en: "AI CV Rewrite" },
    "JD_OPTIMIZATION": { vi: "Tối ưu theo Job Description", en: "JD Optimization" },
    "PREMIUM_TEMPLATE": { vi: "Mẫu CV cao cấp", en: "Premium Templates" },
    "IMPORT_CV": { vi: "Nhập CV từ file", en: "CV Import" },
    "CAREER_VIEW": { vi: "Career Coach", en: "Career Coach" },
    "CAREER_CHAT": { vi: "Tư vấn Career AI", en: "Career AI Coaching" },
    "CAREER_ANALYSIS": { vi: "Phân tích nghề nghiệp", en: "Career Analysis" },
    "CAREER_PROJECTS": { vi: "Dự án Career", en: "Career Projects" },
  };
  const entry = map[feature];
  if (!entry) return feature;
  return lang === "vi" ? entry.vi : entry.en;
}

const PRO_FEATURES = [
  { vi: "Tất cả mẫu CV cao cấp", en: "All premium CV templates" },
  { vi: "Viết lại CV bằng AI không giới hạn", en: "Unlimited AI CV rewriting" },
  { vi: "Tối ưu CV theo Job Description", en: "JD-based CV optimization" },
  { vi: "Tối đa 20 CV", en: "Up to 20 CVs" },
  { vi: "Phân tích ATS nâng cao", en: "Advanced ATS analysis" },
];

const ULTRA_FEATURES = [
  { vi: "Tất cả quyền lợi của Pro", en: "All Pro benefits" },
  { vi: "Truy cập vĩnh viễn (trọn đời)", en: "Lifetime access (one-time payment)" },
  { vi: "Không giới hạn CV & lượt xuất PDF", en: "Unlimited CVs & PDF exports" },
  { vi: "Career Coach AI không giới hạn", en: "Unlimited Career AI Coach" },
  { vi: "Ưu tiên hỗ trợ kỹ thuật", en: "Priority support" },
];

export default function UpgradePromptModal({
  open,
  onClose,
  feature,
  requiredPlan,
  title,
  description,
}: UpgradePromptModalProps) {
  const { language } = useTranslation();
  const router = useRouter();

  if (!open) return null;

  const featureName = resolveFeatureName(feature, language);
  const planLabel = requiredPlan === "PREMIUM" ? "Ultra" : (requiredPlan || "Pro");
  const isUltra = requiredPlan === "PREMIUM" || requiredPlan === "ULTRA";

  const defaultTitle =
    language === "vi"
      ? `Nâng cấp để sử dụng ${featureName}`
      : `Upgrade to use ${featureName}`;

  const defaultDesc =
    language === "vi"
      ? `Tính năng này yêu cầu gói ${planLabel}. Nâng cấp ngay để mở khóa toàn bộ sức mạnh của BetterCV!`
      : `This feature requires the ${planLabel} plan. Upgrade now to unlock BetterCV's full power!`;

  const handleGoUpgrade = () => {
    onClose();
    router.push("/dashboard?tab=upgrade");
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-slate-900 border border-slate-800/80 rounded-2xl p-7 max-w-lg w-full shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon + Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${isUltra ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30" : "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30"}`}>
            <span className={`material-symbols-outlined text-3xl ${isUltra ? "text-amber-400" : "text-indigo-400"}`}>
              {isUltra ? "verified" : "workspace_premium"}
            </span>
          </div>

          <h2 className="text-xl font-bold text-white leading-snug">
            {title || defaultTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-sm">
            {description || defaultDesc}
          </p>
        </div>

        {/* Feature comparison */}
        <div className="space-y-3 mb-6">
          {/* Pro plan */}
          <div className={`rounded-xl border p-4 ${!isUltra ? "border-indigo-500/50 bg-indigo-500/8 ring-1 ring-indigo-500/20" : "border-slate-800 bg-slate-800/40"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-base">workspace_premium</span>
                <p className="text-sm font-bold text-white">Pro</p>
              </div>
              {!isUltra && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {language === "vi" ? "Được đề xuất" : "Recommended"}
                </span>
              )}
            </div>
            <ul className="space-y-1.5">
              {PRO_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-indigo-400 shrink-0">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  {language === "vi" ? f.vi : f.en}
                </li>
              ))}
            </ul>
          </div>

          {/* Ultra plan */}
          <div className={`rounded-xl border p-4 ${isUltra ? "border-amber-500/50 bg-amber-500/8 ring-1 ring-amber-500/20" : "border-slate-800 bg-slate-800/40"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-base">verified</span>
                <p className="text-sm font-bold text-white">Ultra</p>
              </div>
              {isUltra && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {language === "vi" ? "Được đề xuất" : "Recommended"}
                </span>
              )}
            </div>
            <ul className="space-y-1.5">
              {ULTRA_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-amber-400 shrink-0">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  {language === "vi" ? f.vi : f.en}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-2">
          <button
            onClick={handleGoUpgrade}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white shadow-lg transition-all ${isUltra ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20" : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-indigo-500/20"}`}
          >
            <span className="material-symbols-outlined text-base">rocket_launch</span>
            {language === "vi" ? "Xem các gói nâng cấp" : "View upgrade plans"}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-transparent text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            {language === "vi" ? "Để sau" : "Maybe later"}
          </button>
        </div>
      </div>
    </div>
  );
}

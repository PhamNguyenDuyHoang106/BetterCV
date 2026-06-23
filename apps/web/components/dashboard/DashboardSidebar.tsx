"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguageStore } from "../../lib/store/language";
import { translations } from "../../lib/translations";

import { LanguageDropdown } from "../LanguageDropdown";

export type DashboardTab =
  | "dashboard"
  | "resumes"
  | "templates"
  | "upgrade"
  | "settings"
  | "profile";

type NavItem = {
  id: DashboardTab;
  label: string;
  icon: string;
  accent: string;
  iconBg: string;
};

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", accent: "nav-accent-blue", iconBg: "from-emerald-500 to-primary-dark" },
  { id: "resumes", label: "My Resume", icon: "description", accent: "nav-accent-violet", iconBg: "from-violet-500 to-emerald-700" },
  { id: "templates", label: "Template", icon: "dashboard_customize", accent: "nav-accent-teal", iconBg: "from-teal-500 to-primary-darker" },
  { id: "upgrade", label: "Nâng cấp", icon: "workspace_premium", accent: "nav-accent-amber", iconBg: "from-amber-400 to-orange-500" },
  { id: "settings", label: "Cài đặt", icon: "settings", accent: "nav-accent-slate", iconBg: "from-slate-500 to-slate-600" },
];

type Props = {
  activeTab: DashboardTab;
  userName?: string;
  userRole?: string;
  userAvatar?: string | null;
  onTabChange: (tab: DashboardTab) => void;
  onUpgrade: () => void;
  onProfile: () => void;
};

export function DashboardSidebar({
  activeTab,
  userName,
  userRole,
  userAvatar,
  onTabChange,
  onUpgrade,
  onProfile,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeLang = mounted ? language : "vi";
  const t = translations[activeLang];

  const initials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ME";

  const navLabelMap: Record<DashboardTab, string> = {
    dashboard: t.dashboard.title,
    resumes: t.dashboard.tabMyCvs,
    templates: t.dashboard.tabTemplates,
    upgrade: t.dashboard.tabUpgrade,
    settings: t.dashboard.tabSettings,
    profile: t.dashboard.tabProfile,
  };

  const navButtons = (compact?: boolean) =>
    NAV.map((item) => {
      const active = activeTab === item.id;
      const label = navLabelMap[item.id] || item.label;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            onTabChange(item.id);
            setMobileOpen(false);
          }}
          className={`dash-nav-item ${compact ? "px-3 py-2" : ""} ${active ? `dash-nav-item-active ${item.accent}` : ""}`}
          title={label}
        >
          <span className={`dash-nav-icon bg-gradient-to-br ${item.iconBg}`}>
            <span
              className="material-symbols-outlined text-[18px] text-white"
              style={{ fontVariationSettings: active ? "'FILL' 1" : "" }}
            >
              {item.icon}
            </span>
          </span>
          {!compact && <span className="truncate">{label}</span>}
        </button>
      );
    });

  return (
    <>
      <header className="dashboard-topnav fixed top-0 left-0 right-0 z-50 h-topnav-height">
        <div className="h-full max-w-[1600px] mx-auto px-4 md:px-6 flex items-center gap-3 md:gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-primary-darker flex items-center justify-center text-on-primary font-bold text-sm shadow-md shadow-primary/30 group-hover:scale-[1.03] transition-transform">
              BC
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-slate-900 text-sm leading-none">BetterCV</p>
              <p className="text-[10px] font-semibold text-primary-darker uppercase tracking-wider leading-none mt-0.5">
                Resume Builder
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navButtons()}
          </nav>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Language Selector Dropdown */}
            <LanguageDropdown />

            <button
              type="button"
              onClick={onProfile}
              className={`dash-profile-card !p-1.5 !gap-2 ${activeTab === "profile" ? "dash-profile-card-active" : ""}`}
              title={userName || t.dashboard.tabProfile}
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName || "User"}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-dark to-primary-darker flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                  {initials}
                </div>
              )}
              <div className="hidden md:block min-w-0 text-left">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[100px]">{userName || "User"}</p>
                <p className="text-[10px] text-slate-500 truncate">{userRole || "Free"}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-white/70 border border-slate-200/80"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined">{mobileOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden absolute top-topnav-height left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-primary/20 shadow-lg px-4 py-4 flex flex-col gap-1 animate-[gallery-fade-in_0.2s_ease-out]">
            {navButtons(true)}
            <button
              type="button"
              onClick={() => {
                onUpgrade();
                setMobileOpen(false);
              }}
              className="dash-pro-cta mt-2 flex items-center justify-center gap-2 text-white text-sm font-bold w-full"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              {t.dashboard.tabUpgrade}
            </button>
          </div>
        )}
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 top-topnav-height z-40 bg-black/20"
          aria-label={t.nav.close}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

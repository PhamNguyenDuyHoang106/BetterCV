"use client";

import Link from "next/link";

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
  { id: "dashboard", label: "Dashboard", icon: "dashboard", accent: "nav-accent-blue", iconBg: "from-sky-500 to-primary" },
  { id: "resumes", label: "My Resume", icon: "description", accent: "nav-accent-violet", iconBg: "from-violet-500 to-indigo-600" },
  { id: "templates", label: "Template", icon: "dashboard_customize", accent: "nav-accent-teal", iconBg: "from-teal-500 to-cyan-600" },
  { id: "upgrade", label: "Nâng cấp gói", icon: "workspace_premium", accent: "nav-accent-amber", iconBg: "from-amber-400 to-orange-500" },
  { id: "settings", label: "Cài đặt", icon: "settings", accent: "nav-accent-slate", iconBg: "from-slate-500 to-slate-600" },
];

type Props = {
  isOpen: boolean;
  activeTab: DashboardTab;
  userName?: string;
  userRole?: string;
  onTabChange: (tab: DashboardTab) => void;
  onClose: () => void;
  onOpen?: () => void;
  onUpgrade: () => void;
  onProfile: () => void;
};

export function DashboardSidebar({
  isOpen,
  activeTab,
  userName,
  userRole,
  onTabChange,
  onClose,
  onOpen,
  onUpgrade,
  onProfile,
}: Props) {
  const initials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ME";

  return (
    <nav
      className={`dashboard-sidebar fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 transform overflow-y-auto no-scrollbar ${
        isOpen
          ? "w-80 translate-x-0 py-8 px-5"
          : "w-0 -translate-x-full p-0 border-r-0 md:w-20 md:translate-x-0 md:py-8 md:px-3 md:border-r"
      }`}
    >
      <div className="flex flex-col items-center gap-4 mb-8 mt-2 shrink-0">
        <div className={`flex items-center w-full ${isOpen ? "justify-between" : "justify-center"}`}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-[#0077b6] to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/25 group-hover:scale-[1.03] transition-transform shrink-0">
              BC
            </div>
            {isOpen && (
              <div className="animate-[gallery-fade-in_0.2s_ease-out] truncate text-left">
                <h1 className="font-bold text-slate-900 tracking-tight leading-none mb-0.5">BetterCV</h1>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider leading-none">Resume Builder</p>
              </div>
            )}
          </Link>
          {isOpen && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/60 rounded-xl text-slate-500 transition-colors shrink-0"
              title="Thu gọn sidebar"
            >
              <span className="material-symbols-outlined">menu_open</span>
            </button>
          )}
        </div>
        {!isOpen && onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="hidden md:flex p-1.5 hover:bg-white/60 rounded-xl text-slate-500 transition-colors"
            title="Mở rộng sidebar"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        )}
      </div>

      {isOpen && (
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-3 mb-2 shrink-0 animate-[gallery-fade-in_0.2s_ease-out]">
          Workspace
        </p>
      )}

      <ul className="flex flex-col gap-1 flex-grow">
        {NAV.map((item) => {
          const active = activeTab === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`dash-nav-item w-full ${isOpen ? "" : "justify-center px-0"} ${active ? `dash-nav-item-active ${item.accent}` : ""}`}
                title={isOpen ? undefined : item.label}
              >
                <span className={`dash-nav-icon bg-gradient-to-br ${item.iconBg}`}>
                  <span
                    className="material-symbols-outlined text-[18px] text-white"
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "" }}
                  >
                    {item.icon}
                  </span>
                </span>
                {isOpen && <span className="flex-1 text-left animate-[gallery-fade-in_0.2s_ease-out] truncate">{item.label}</span>}
                {isOpen && active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {isOpen ? (
        <button
          type="button"
          onClick={onUpgrade}
          className="dash-pro-cta mb-3 shrink-0 text-left animate-[gallery-fade-in_0.2s_ease-out]"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-amber-200 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <span className="text-xs font-bold text-white">Pro Builder</span>
          </div>
          <p className="text-[10px] text-white/80 leading-snug">AI rewrite · Mẫu Premium · Xuất PDF không giới hạn</p>
          <span className="inline-block mt-2 text-[10px] font-bold text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-md">
            Nâng cấp ngay →
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onUpgrade}
          className="hidden md:flex w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 hover:scale-105 transition-all shadow-md items-center justify-center text-white mb-3 mx-auto"
          title="Nâng cấp Pro Builder"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </button>
      )}

      <div className="mt-auto space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => alert("BetterCV Support is ready to help!")}
          className={`w-full flex items-center ${isOpen ? "justify-start gap-3 px-3" : "justify-center px-0"} py-2.5 text-slate-500 hover:text-primary hover:bg-white/50 rounded-xl text-sm font-semibold transition-all`}
          title={isOpen ? undefined : "Trợ giúp"}
        >
          <span className="material-symbols-outlined text-lg">help</span>
          {isOpen && <span className="animate-[gallery-fade-in_0.2s_ease-out] truncate">Trợ giúp</span>}
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={onProfile}
          onKeyDown={(e) => e.key === "Enter" && onProfile()}
          className={`dash-profile-card ${isOpen ? "" : "justify-center p-1 hover:bg-white/30 rounded-xl border-0 bg-transparent shadow-none"} ${activeTab === "profile" ? "dash-profile-card-active" : ""}`}
          title={isOpen ? undefined : userName || "Hồ sơ cá nhân"}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
            {initials}
          </div>
          {isOpen && (
            <div className="min-w-0 flex-1 text-left animate-[gallery-fade-in_0.2s_ease-out]">
              <p className="text-xs font-bold text-slate-900 truncate">{userName || "BetterCV User"}</p>
              <p className="text-[10px] text-slate-500 truncate">{userRole || "Free"}</p>
            </div>
          )}
          {isOpen && (
            <span className="material-symbols-outlined text-slate-400 text-lg shrink-0">chevron_right</span>
          )}
        </div>
      </div>
    </nav>
  );
}

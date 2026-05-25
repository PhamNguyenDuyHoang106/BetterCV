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
      className={`dashboard-sidebar fixed md:sticky left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ${
        isOpen ? "w-[280px] translate-x-0 px-4 py-6" : "w-0 -translate-x-full p-0 overflow-hidden"
      }`}
    >
      <div className="flex items-center justify-between mb-6 shrink-0">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-[#0077b6] to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/25 group-hover:scale-[1.03] transition-transform">
            BC
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight">BetterCV</h1>
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Resume Builder</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-white/60 rounded-xl text-slate-500 transition-colors"
          title="Thu gọn sidebar"
        >
          <span className="material-symbols-outlined">menu_open</span>
        </button>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-3 mb-2">Workspace</p>
      <ul className="flex flex-col gap-1 flex-grow">
        {NAV.map((item) => {
          const active = activeTab === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`dash-nav-item w-full ${active ? `dash-nav-item-active ${item.accent}` : ""}`}
              >
                <span className={`dash-nav-icon bg-gradient-to-br ${item.iconBg}`}>
                  <span
                    className="material-symbols-outlined text-[18px] text-white"
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "" }}
                  >
                    {item.icon}
                  </span>
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onUpgrade}
        className="dash-pro-cta mb-3 shrink-0 text-left"
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

      <div className="mt-auto space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => alert("BetterCV Support is ready to help!")}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-primary hover:bg-white/50 rounded-xl text-sm font-semibold transition-all"
        >
          <span className="material-symbols-outlined text-lg">help</span>
          Trợ giúp
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={onProfile}
          onKeyDown={(e) => e.key === "Enter" && onProfile()}
          className={`dash-profile-card ${activeTab === "profile" ? "dash-profile-card-active" : ""}`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-bold text-slate-900 truncate">{userName || "BetterCV User"}</p>
            <p className="text-[10px] text-slate-500 truncate">{userRole || "Free"}</p>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-lg shrink-0">chevron_right</span>
        </div>
      </div>
    </nav>
  );
}

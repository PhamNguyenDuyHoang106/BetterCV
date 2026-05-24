"use client";

export type DashboardTab =
  | "dashboard"
  | "resumes"
  | "templates"
  | "upgrade"
  | "settings"
  | "profile";

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

function navBtn(active: boolean) {
  return `w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
    active
      ? "bg-primary-container/20 text-primary font-bold shadow-sm"
      : "text-text-secondary hover:text-primary hover:bg-white/20"
  }`;
}

function NavIcon({ icon, filled }: { icon: string; filled: boolean }) {
  return (
    <span
      className="material-symbols-outlined text-lg"
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "" }}
    >
      {icon}
    </span>
  );
}

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
      className={`fixed md:sticky left-0 top-0 h-screen z-40 bg-glass-bg backdrop-blur-md border-r border-glass-border shadow-sm py-8 px-5 flex flex-col gap-4 transition-all duration-300 transform ${
        isOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full p-0 overflow-hidden border-r-0"
      }`}
    >
      <div className="flex items-center justify-between mb-8 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
            BC
          </div>
          <div>
            <h1 className="font-section-title font-bold text-primary tracking-tight text-lg">BetterCV</h1>
            <p className="font-label-sm text-[10px] text-text-secondary">Professional Plan</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          title="Collapse Sidebar"
        >
          <span className="material-symbols-outlined text-xl">menu_open</span>
        </button>
      </div>

      <ul className="flex flex-col gap-2 flex-grow">
        <li>
          <button type="button" onClick={() => onTabChange("dashboard")} className={navBtn(activeTab === "dashboard")}>
            <NavIcon icon="dashboard" filled={activeTab === "dashboard"} />
            Dashboard
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onTabChange("resumes")} className={navBtn(activeTab === "resumes")}>
            <NavIcon icon="description" filled={activeTab === "resumes"} />
            My Resume
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onTabChange("templates")} className={navBtn(activeTab === "templates")}>
            <NavIcon icon="dashboard_customize" filled={activeTab === "templates"} />
            Template
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onTabChange("upgrade")} className={navBtn(activeTab === "upgrade")}>
            <NavIcon icon="star" filled={activeTab === "upgrade"} />
            Nâng cấp gói
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onTabChange("settings")} className={navBtn(activeTab === "settings")}>
            <NavIcon icon="settings" filled={activeTab === "settings"} />
            Cài đặt
          </button>
        </li>
      </ul>

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={() => alert("BetterCV Support is ready to help!")}
          className="w-full flex items-center gap-3 text-text-secondary hover:text-primary px-4 py-2.5 transition-colors rounded-xl text-left text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-lg">help</span>
          Trợ giúp
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={onProfile}
          onKeyDown={(e) => e.key === "Enter" && onProfile()}
          className={`flex items-center justify-between p-3 glass-panel rounded-2xl shadow-sm border select-none transition-all duration-200 cursor-pointer ${
            activeTab === "profile"
              ? "bg-primary-container/10 border-primary"
              : "border-white/50 hover:bg-white/30"
          }`}
        >
          <div className="flex items-center gap-2.5 truncate max-w-[70%]">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              {initials}
            </div>
            <div className="truncate text-left">
              <p className="text-xs text-text-primary font-bold truncate leading-tight">
                {userName || "BetterCV User"}
              </p>
              <p className="text-[10px] text-text-secondary leading-none mt-0.5">
                {userRole || "Free"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpgrade();
            }}
            className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-[10px] font-bold text-text-primary rounded-lg transition-colors"
          >
            Nâng cấp
          </button>
        </div>
      </div>
    </nav>
  );
}

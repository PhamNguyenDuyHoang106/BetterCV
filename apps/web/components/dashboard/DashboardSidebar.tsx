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
  onOpen?: () => void;
  onUpgrade: () => void;
  onProfile: () => void;
};

function navBtn(active: boolean, isOpen: boolean) {
  return `w-full flex items-center ${isOpen ? "justify-start gap-3 px-4" : "justify-center px-0"} py-3 rounded-xl text-sm font-semibold transition-all ${
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
      className={`fixed left-0 top-0 h-screen z-40 bg-glass-bg backdrop-blur-md border-r border-glass-border shadow-sm flex flex-col gap-4 transition-all duration-300 transform overflow-y-auto no-scrollbar ${
        isOpen
          ? "w-80 translate-x-0 py-8 px-5"
          : "w-0 -translate-x-full p-0 border-r-0 md:w-20 md:translate-x-0 md:py-8 md:px-3 md:border-r"
      }`}
    >
      <div className="flex flex-col items-center gap-4 mb-8 mt-2 shrink-0">
        <div className={`flex items-center w-full ${isOpen ? "justify-between" : "justify-center"}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
              BC
            </div>
            {isOpen && (
              <div className="animate-[gallery-fade-in_0.2s_ease-out] truncate">
                <h1 className="font-section-title font-bold text-primary tracking-tight text-lg">BetterCV</h1>
                <p className="font-label-sm text-[10px] text-text-secondary">Professional Plan</p>
              </div>
            )}
          </div>
          {isOpen && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-text-secondary hover:text-text-primary transition-colors shrink-0"
              title="Collapse Sidebar"
            >
              <span className="material-symbols-outlined text-xl">menu_open</span>
            </button>
          )}
        </div>
        {!isOpen && onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="hidden md:flex p-1.5 hover:bg-slate-100 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            title="Expand Sidebar"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-2 flex-grow">
        <li>
          <button type="button" onClick={() => onTabChange("dashboard")} className={navBtn(activeTab === "dashboard", isOpen)} title={isOpen ? undefined : "Tổng quan"}>
            <NavIcon icon="dashboard" filled={activeTab === "dashboard"} />
            {isOpen && <span className="animate-[gallery-fade-in_0.2s_ease-out] truncate">Dashboard</span>}
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onTabChange("resumes")} className={navBtn(activeTab === "resumes", isOpen)} title={isOpen ? undefined : "CV của tôi"}>
            <NavIcon icon="description" filled={activeTab === "resumes"} />
            {isOpen && <span className="animate-[gallery-fade-in_0.2s_ease-out] truncate">My Resume</span>}
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onTabChange("templates")} className={navBtn(activeTab === "templates", isOpen)} title={isOpen ? undefined : "Mẫu CV"}>
            <NavIcon icon="dashboard_customize" filled={activeTab === "templates"} />
            {isOpen && <span className="animate-[gallery-fade-in_0.2s_ease-out] truncate">Template</span>}
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onTabChange("upgrade")} className={navBtn(activeTab === "upgrade", isOpen)} title={isOpen ? undefined : "Nâng cấp gói"}>
            <NavIcon icon="star" filled={activeTab === "upgrade"} />
            {isOpen && <span className="animate-[gallery-fade-in_0.2s_ease-out] truncate">Nâng cấp gói</span>}
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onTabChange("settings")} className={navBtn(activeTab === "settings", isOpen)} title={isOpen ? undefined : "Cài đặt"}>
            <NavIcon icon="settings" filled={activeTab === "settings"} />
            {isOpen && <span className="animate-[gallery-fade-in_0.2s_ease-out] truncate">Cài đặt</span>}
          </button>
        </li>
      </ul>

      <div className="mt-auto flex flex-col gap-2 shrink-0">
        <button
          type="button"
          onClick={() => alert("BetterCV Support is ready to help!")}
          className={`w-full flex items-center ${isOpen ? "justify-start gap-3 px-4" : "justify-center px-0"} py-2.5 text-text-secondary hover:text-primary transition-colors rounded-xl text-left text-sm font-semibold`}
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
          className={`flex items-center transition-all duration-200 cursor-pointer select-none ${
            isOpen
              ? "justify-between p-3 glass-panel rounded-2xl shadow-sm border"
              : "justify-center p-1 hover:bg-white/30 rounded-xl"
          } ${
            activeTab === "profile"
              ? isOpen ? "bg-primary-container/10 border-primary" : "bg-primary-container/20"
              : isOpen ? "border-white/50 hover:bg-white/30" : ""
          }`}
          title={isOpen ? undefined : userName || "Hồ sơ cá nhân"}
        >
          <div className={`flex items-center ${isOpen ? "gap-2.5 truncate max-w-[70%]" : "justify-center"}`}>
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              {initials}
            </div>
            {isOpen && (
              <div className="truncate text-left animate-[gallery-fade-in_0.2s_ease-out]">
                <p className="text-xs text-text-primary font-bold truncate leading-tight">
                  {userName || "BetterCV User"}
                </p>
                <p className="text-[10px] text-text-secondary leading-none mt-0.5">
                  {userRole || "Free"}
                </p>
              </div>
            )}
          </div>

          {isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpgrade();
              }}
              className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-[10px] font-bold text-text-primary rounded-lg transition-colors shrink-0 animate-[gallery-fade-in_0.2s_ease-out]"
            >
              Nâng cấp
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

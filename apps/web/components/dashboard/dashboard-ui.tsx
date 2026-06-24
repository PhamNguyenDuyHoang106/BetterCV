import type { ReactNode } from "react";

const ACCENTS = {
  blue: "from-sky-500 to-primary",
  violet: "from-violet-500 to-indigo-600",
  teal: "from-teal-500 to-cyan-600",
  amber: "from-amber-400 to-orange-500",
  emerald: "from-emerald-500 to-teal-600",
  rose: "from-rose-500 to-pink-600",
} as const;

export type DashAccent = keyof typeof ACCENTS;

export function DashPageHero({
  title,
  subtitle,
  accent = "blue",
}: {
  title: string;
  subtitle: string;
  accent?: DashAccent;
}) {
  return (
    <div className="dash-page-hero mb-8">
      <div className={`dash-page-hero-accent bg-gradient-to-r ${ACCENTS[accent]}`} />
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
      <p className="text-slate-500 mt-2 text-sm md:text-base max-w-2xl leading-relaxed">{subtitle}</p>
    </div>
  );
}

export function DashStatCard({
  icon,
  accent = "blue",
  badge,
  label,
  value,
  footer,
}: {
  icon: string;
  accent?: DashAccent;
  badge?: ReactNode;
  label: string;
  value: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="dash-stat-card group">
      <div className={`dash-stat-glow bg-gradient-to-br ${ACCENTS[accent]} opacity-[0.08]`} />
      <div className="relative z-[1]">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ACCENTS[accent]} flex items-center justify-center text-white shadow-lg`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {icon}
            </span>
          </div>
          {badge}
        </div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{value}</p>
        {footer}
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${ACCENTS[accent]} opacity-40 group-hover:opacity-100 transition-opacity`} />
    </div>
  );
}

export function DashPanel({
  title,
  icon,
  iconAccent = "blue",
  children,
  className = "",
  action,
}: {
  title: string;
  icon?: string;
  iconAccent?: DashAccent;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`dash-panel ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-5">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          {icon && (
            <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ACCENTS[iconAccent]} flex items-center justify-center text-white shadow-md`}>
              <span className="material-symbols-outlined text-lg">{icon}</span>
            </span>
          )}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export const dashInputClass =
  "w-full bg-white border border-slate-200/90 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 shadow-sm transition-all";

export const dashSelectClass = dashInputClass;

export function DashPrimaryBtn({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`dash-btn-primary ${className}`} {...props}>
      {children}
    </button>
  );
}

export function DashGhostBtn({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`dash-btn-ghost ${className}`} {...props}>
      {children}
    </button>
  );
}

export function DashToggleRow({
  title,
  description,
  defaultChecked,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div className="dash-toggle-row">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        className="h-5 w-5 rounded-md border-slate-300 text-primary focus:ring-primary/30 shrink-0 cursor-pointer"
      />
    </div>
  );
}

export function DashEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="dash-empty-state">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center text-primary mb-5">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <p className="text-lg font-bold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

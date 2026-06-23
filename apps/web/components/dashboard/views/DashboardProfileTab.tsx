"use client";

import { useState, useEffect } from "react";
import type { UseFormRegister, UseFormHandleSubmit } from "react-hook-form";
import { useLanguageStore } from "../../../lib/store/language";
import { translations } from "../../../lib/translations";
import { DashPageHero, DashPanel, dashInputClass } from "../dashboard-ui";

type ProfileForm = { fullName: string };

type Props = {
  user?: { fullName?: string; email?: string; role?: string; avatarUrl?: string | null } | null;
  errorMsg: string | null;
  register: UseFormRegister<ProfileForm>;
  onSubmit: UseFormHandleSubmit<ProfileForm>;
  onUpdate: (values: ProfileForm) => void;
  onLogout: () => void;
};

export function DashboardProfileTab({
  user,
  errorMsg,
  register,
  onSubmit,
  onUpdate,
  onLogout,
}: Props) {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeLang = mounted ? language : "vi";
  const t = translations[activeLang];

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ME";

  return (
    <div className="max-w-2xl mx-auto w-full py-4">
      <DashPageHero
        title={t.profile.title}
        subtitle={t.profile.subtitle}
        accent="violet"
      />

      <DashPanel title={t.profile.infoPanel} icon="person" iconAccent="violet">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user?.fullName || "User"}
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-slate-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-primary-darker flex items-center justify-center text-on-primary font-bold text-xl shadow-lg">
              {initials}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.fullName || "BetterCV User"}</h3>
            <p className="text-sm text-slate-500">{t.profile.memberOf}</p>
          </div>
        </div>

        <form onSubmit={onSubmit(onUpdate)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">{t.profile.emailLabel}</label>
              <input
                type="text"
                className={`${dashInputClass} bg-slate-50 cursor-not-allowed text-slate-500`}
                value={user?.email || "user@example.com"}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">{t.profile.roleLabel}</label>
              <input
                type="text"
                className={`${dashInputClass} bg-slate-50 cursor-not-allowed text-slate-500 font-bold`}
                value={user?.role || "FREE MEMBER"}
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">{t.profile.nameLabel}</label>
            <input type="text" className={dashInputClass} {...register("fullName", { required: true })} />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{errorMsg}</p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className="dash-btn-primary">
              {t.profile.updateBtn}
            </button>
            <button type="button" onClick={onLogout} className="dash-btn-danger flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">logout</span>
              {t.profile.logoutBtn}
            </button>
          </div>
        </form>
      </DashPanel>
    </div>
  );
}

"use client";

import type { UseFormRegister, UseFormHandleSubmit } from "react-hook-form";
import { DashPageHero, DashPanel, dashInputClass } from "../dashboard-ui";

type ProfileForm = { fullName: string };

type Props = {
  user?: { fullName?: string; email?: string; role?: string } | null;
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
        title="Hồ sơ cá nhân"
        subtitle="Cập nhật họ tên và quản lý phiên đăng nhập workspace."
        accent="violet"
      />

      <DashPanel title="Thông tin tài khoản" icon="person" iconAccent="violet">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-primary-darker flex items-center justify-center text-on-primary font-bold text-xl shadow-lg">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.fullName || "BetterCV User"}</h3>
            <p className="text-sm text-slate-500">Member of BetterCV</p>
          </div>
        </div>

        <form onSubmit={onSubmit(onUpdate)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Email Address</label>
              <input
                type="text"
                className={`${dashInputClass} bg-slate-50 cursor-not-allowed text-slate-500`}
                value={user?.email || "user@example.com"}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Account Role</label>
              <input
                type="text"
                className={`${dashInputClass} bg-slate-50 cursor-not-allowed text-slate-500 font-bold`}
                value={user?.role || "FREE MEMBER"}
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name (Họ tên)</label>
            <input type="text" className={dashInputClass} {...register("fullName", { required: true })} />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{errorMsg}</p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className="dash-btn-primary">
              Cập nhật họ tên
            </button>
            <button type="button" onClick={onLogout} className="dash-btn-danger flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">logout</span>
              Đăng xuất
            </button>
          </div>
        </form>
      </DashPanel>
    </div>
  );
}

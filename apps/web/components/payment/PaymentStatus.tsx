import React from "react";
import { PaymentStatus as StatusType } from "../../hooks/usePaymentModal";

interface PaymentStatusProps {
  status: StatusType;
  t: {
    waiting: string;
    success: string;
    successSub: string;
    expired: string;
    expiredSub: string;
    error: string;
    newQr: string;
    errorRetry: string;
  };
  errorMessage?: string | null;
  onRegenerate: () => void;
}

export function PaymentStatus({
  status,
  t,
  errorMessage,
  onRegenerate,
}: PaymentStatusProps) {
  if (status === "polling" || status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center py-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider animate-pulse">
            {t.waiting}
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <span className="material-symbols-outlined text-[32px] font-bold">
            check_circle
          </span>
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 text-base">{t.success}</h4>
          <p className="text-xs text-slate-500">{t.successSub}</p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">
            warning
          </span>
        </div>
        <div className="space-y-1 max-w-xs">
          <h4 className="font-bold text-slate-900 text-base">{t.expired}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{t.expiredSub}</p>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-xs font-bold text-white rounded-xl shadow-md shadow-indigo-500/10 border-none transition-all"
        >
          {t.newQr}
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">
            error
          </span>
        </div>
        <div className="space-y-1 max-w-xs">
          <h4 className="font-bold text-slate-900 text-base">{t.error}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {errorMessage || t.error}
          </p>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl border border-slate-700 transition-all"
        >
          {t.errorRetry}
        </button>
      </div>
    );
  }

  return null;
}

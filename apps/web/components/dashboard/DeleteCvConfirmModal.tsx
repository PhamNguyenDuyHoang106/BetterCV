"use client";

import { useTranslation } from "../../hooks/useTranslation";

type Props = {
  open: boolean;
  cvTitle: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteCvConfirmModal({
  open,
  cvTitle,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
        aria-hidden 
      />
      
      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-100 p-6 sm:p-8 shadow-[0_24px_64px_-16px_rgba(15,23,42,0.24)] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          onClick={onClose}
          disabled={loading}
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Warning Icon & Content */}
        <div className="flex flex-col items-center text-center mt-2">
          {/* Pulsing warning icon container */}
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-5 relative">
            <span className="absolute inset-0 rounded-2xl bg-rose-400/10 animate-ping duration-1000 opacity-75" />
            <span className="material-symbols-outlined text-3xl font-bold relative z-10">delete_forever</span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
            {t.deleteCvModal.title}
          </h3>
          
          <p className="text-sm text-slate-500 leading-relaxed px-2 mb-6">
            {t.deleteCvModal.desc.replace("{title}", cvTitle)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.deleteCvModal.cancelBtn}
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-sm font-bold shadow-lg shadow-rose-500/20 hover:shadow-rose-600/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-base">delete</span>
            )}
            {t.deleteCvModal.confirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
